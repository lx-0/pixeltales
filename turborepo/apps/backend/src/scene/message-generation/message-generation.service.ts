import { AIMessage, HumanMessage } from '@langchain/core/messages';
import { Inject, Injectable } from '@nestjs/common';
import {
  CharacterAction,
  DBMessage,
  Message,
  NewDBMessage,
  SceneState,
} from '@pixeltales/contracts';
import { DBSceneConfig, dbSchema } from '@pixeltales/database';
import { randomUUID } from 'crypto';
import { PinoLogger } from 'nestjs-pino';
import { DRIZZLE_INSTANCE, DrizzleSqliteDatabase } from '../../db/drizzle.provider';
import { LlmService } from '../../llm/llm.service';
import { SceneStateService } from '../scene-state/scene-state.service';
import { SystemMessageVars } from '../scene.const';

// Constants
const END_CONVERSATION_REQUEST_VALIDITY_S = 180; // 3 minutes

@Injectable()
export class MessageGenerationService {
  constructor(
    @Inject(DRIZZLE_INSTANCE) private readonly db: DrizzleSqliteDatabase,
    private readonly logger: PinoLogger,
    private readonly llmService: LlmService,
    private readonly sceneStateService: SceneStateService,
  ) {
    this.logger.setContext(MessageGenerationService.name);
  }

  /**
   * Generate a message for a character
   *
   * This is the main function for generating a message for a character.
   * It handles:
   * - Preparing the context for the LLM
   * - Calling the LLM to generate a response
   * - Saving the message to the database
   * - Updating character state
   * - Setting character actions (thinking, speaking)
   */
  async generateMessage(
    sceneState: SceneState,
    sceneConfig: DBSceneConfig,
    characterId: string,
    recipientId: string | null,
    conversationHistory: Array<HumanMessage | AIMessage>,
  ): Promise<DBMessage | null> {
    // Get variables from params for short-hand usage
    const character = sceneState.characters[characterId];
    if (!character) {
      this.logger.error(
        `Cannot generate message for character ${characterId} - character not found in scene state`,
      );
      return null;
    }
    const characterConfig = sceneConfig.config.characters_config[characterId];
    if (!characterConfig) {
      this.logger.error(
        `Cannot generate message for character ${characterId} - character config not found`,
      );
      return null;
    }

    // Generate a trace ID for this message generation
    const traceId = randomUUID().split('-')[0];
    let lastError: Error | null = null;
    let retryCount = 0;
    const maxRetries = 3;
    let backoffTime = 500; // Start with 500ms backoff

    while (retryCount < maxRetries) {
      try {
        // Prepare context for the LLM
        const provider = characterConfig.llm_config.provider;
        const systemMessageVars = this.prepareSystemMessage(
          sceneState,
          sceneConfig,
          characterId,
          recipientId,
        );

        // Call the LLM to generate a response
        this.logger.info(
          {
            traceId,
            characterId,
            characterName: character.name,
            historyLength: conversationHistory.length,
            provider: characterConfig.llm_config.provider,
            model: characterConfig.llm_config.model_name,
          },
          `Generating AI response for character ${character.name}`,
        );

        const response = await this.llmService.generateResponse(characterId, {
          history: conversationHistory,
          ...systemMessageVars,
        });

        this.logger.debug(
          { traceId, characterId, characterName: character.name, response },
          `Successfully generated response for ${characterId}`,
        );

        // Clean and validate the content
        const content = response.content || '';
        if (!content && !response.end_conversation) {
          // We have an empty content but no end conversation request
          this.logger.warn(
            { traceId, characterId },
            'Generated empty content without end_conversation flag. Retrying...',
          );
          continue; // Retry generation
        }

        // Calculate speaking time based on message length for realistic conversation pacing
        const nowTimestamp = Date.now();
        const speakingTimeMs = this.calculateSpeakingTime(content.length);

        // Calculate token usage for analytics if available - this may not be available in the response
        const totalTokensUsed = 0; // We don't have token usage info with the current LLM response format

        // Create message record for database (DB) - using NewDBMessage type for insert
        const newMessageData: NewDBMessage = {
          id: randomUUID(),
          sceneId: sceneState.scene_id,
          characterId: characterId,
          content: content,
          timestamp: new Date(nowTimestamp),
          thoughts: response.thoughts,
          mood: response.mood,
          moodEmoji: response.mood_emoji,
          modelUsed: characterConfig.llm_config.model_name,
          recipient: response.recipient || recipientId || '',
          reactionOnPrevious: response.reaction_on_previous_message || null,
          calculatedSpeakingTime: speakingTimeMs / 1000,
          endConversation: response.end_conversation,
          conversationRating: response.conversation_rating,
          tokenCount: totalTokensUsed,
          cost: null, // TODO: Add cost calculation later
        };

        // Create a state message (for legacy support) from the data needed for a Message
        const stateMessage: Message = {
          character: characterId,
          content: content,
          timestamp: new Date(nowTimestamp).toISOString(),
          unix_timestamp: nowTimestamp,
          thoughts: response.thoughts,
          mood: response.mood,
          mood_emoji: response.mood_emoji,
          recipient: response.recipient || recipientId || '',
          reaction_on_previous_message: response.reaction_on_previous_message || null,
          calculated_speaking_time: speakingTimeMs / 1000,
          conversation_rating: response.conversation_rating,
          end_conversation: response.end_conversation,
        };

        // Always add the message to the scene state first
        this.sceneStateService.addMessageToState(stateMessage);

        // Update character state
        this.sceneStateService.updateCharacterState(characterId, {
          current_mood: response.mood,
          end_conversation_requested: response.end_conversation,
          end_conversation_requested_at: response.end_conversation ? nowTimestamp : undefined,
          end_conversation_requested_validity_duration: response.end_conversation
            ? END_CONVERSATION_REQUEST_VALIDITY_S
            : undefined,
        });

        // Set character to speaking state
        await this.setCharacterAction(characterId, 'speaking', speakingTimeMs);

        // Try to save message to database, but continue even if it fails
        try {
          // eslint-disable-next-line @typescript-eslint/await-thenable
          const insertedMessage: DBMessage = await this.db
            .insert(dbSchema.messagesTable)
            .values(newMessageData)
            .returning()
            .get();

          this.logger.info(
            { traceId, messageId: insertedMessage.id, characterId, tokenCount: totalTokensUsed },
            `Saved message ${insertedMessage.id} from ${characterId}`,
          );

          return insertedMessage;
        } catch (dbError) {
          // Handle database errors - log but continue since we already added to state
          this.logger.error(
            { traceId, err: dbError, characterId },
            `Failed to save message to database for character ${characterId}, but message was added to scene state`,
          );

          // We'll ignore the linter warning about the type assertion to avoid further complex type issues
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return newMessageData as DBMessage;
        }
      } catch (error) {
        retryCount++;
        lastError = error as Error;

        // Don't retry database errors
        if (error instanceof Error && error.message.includes('database')) {
          this.logger.error(
            { traceId, err: error, characterId },
            `Database error when generating message for ${characterId}, not retrying`,
          );
          break;
        }

        // If we've reached max retries, log and exit
        if (retryCount >= maxRetries) {
          this.logger.error(
            { traceId, err: error, characterId, attempts: retryCount },
            `Failed to generate message after ${maxRetries} attempts`,
          );
          break;
        }

        // Add jitter to backoff
        const jitter = Math.random() * 100;
        const waitTime = backoffTime + jitter;

        this.logger.warn(
          {
            traceId,
            err: error,
            characterId,
            retryCount,
            maxRetries,
            waitTime: Math.round(waitTime),
          },
          `Error generating response, retrying in ${Math.round(waitTime)}ms`,
        );

        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        backoffTime *= 2; // Double the backoff time for next retry
      }
    }

    // Recovery: set character back to idle if all retries failed
    this.logger.error(
      { traceId, err: lastError, characterId },
      `All attempts to generate message failed for character ${characterId}`,
    );
    await this.setCharacterAction(characterId, 'idle', undefined);

    return null;
  }

  /**
   * Prepare system message with context
   * This creates a rich context for the LLM with scene details, character information,
   * and other relevant data to guide the response generation
   */
  prepareSystemMessage(
    sceneState: SceneState,
    sceneConfig: DBSceneConfig,
    characterId: string,
    recipientId: string | null,
  ): SystemMessageVars {
    // Get character info
    const character = sceneState.characters[characterId];
    if (!character) {
      this.logger.warn(`Character ${characterId} not found in scene state, using defaults`);
      return {
        character_name: characterId,
        character_visual: 'Unknown character',
        character_role: 'Unknown role',
        message_recipient: recipientId || '',
        scene_description: sceneConfig.config.description,
        input:
          sceneState.messages.length === 0
            ? 'Start a conversation. Introduce yourself and engage with the other character.'
            : 'Continue the conversation naturally.',
        conversation_length: sceneState.messages.length.toString(),
        current_time: new Date().toLocaleTimeString(),
      };
    }

    // Build rich description of all characters in the scene
    const charactersDescription = Object.values(sceneState.characters)
      .map((char) => {
        if (!char) return '';
        // For each character, include more details if available
        const details = [];
        if (char.visual) details.push(char.visual);
        if (char.current_mood) details.push(`Current mood: ${char.current_mood}`);
        return `- ${char.name || 'Unknown'}: ${details.join(', ')}`;
      })
      .filter((desc) => desc !== '')
      .join('\n');

    // Create complete scene description with environment and characters
    const sceneDescription = [
      sceneConfig.config.description,
      '',
      'Characters:',
      charactersDescription,
    ].join('\n');

    // Determine conversation stage based on message count
    let input: string;
    if (sceneState.messages.length === 0) {
      input = 'Start a conversation. Introduce yourself and engage with the other character.';
    } else if (sceneState.messages.length < 5) {
      input = 'Continue the conversation. Ask questions and show interest in what was just said.';
    } else {
      input = 'Continue the conversation naturally. Develop the topics discussed so far.';
    }

    // Add detailed recipient info if available
    let recipientInfo = '';
    if (recipientId && sceneState.characters[recipientId]) {
      const recipient = sceneState.characters[recipientId];
      recipientInfo = recipient?.name || recipientId;
    }

    // Return comprehensive template variables
    return {
      character_name: character.name,
      character_visual: character.visual || '',
      character_role: character.role || '',
      message_recipient: recipientInfo,
      scene_description: sceneDescription,
      input: input,
      conversation_length: sceneState.messages.length.toString(),
      current_time: new Date().toLocaleTimeString(),
      // Add character-specific context if available
      character_mood: character.current_mood || '',
    };
  }

  /**
   * Calculate speaking time based on message length
   */
  calculateSpeakingTime(messageLength: number): number {
    const baseSpeakingTime = 5000; // 5 seconds base time
    const charSpeakingTime = 50; // 50ms per character

    return baseSpeakingTime + messageLength * charSpeakingTime;
  }

  /**
   * Set a character's action
   */
  async setCharacterAction(
    characterId: string,
    action: CharacterAction,
    estimatedDurationMs?: number,
  ): Promise<void> {
    this.logger.debug(`Setting action for ${characterId}: ${action}`);
    this.sceneStateService.updateCharacterState(characterId, {
      action: action,
      action_started_at: Date.now(),
      action_estimated_duration: estimatedDurationMs ? estimatedDurationMs / 1000 : undefined,
    });
  }

  /**
   * Convert a DBMessage to a state Message
   */
  mapDBMessageToStateMessage(dbMessage: DBMessage): Message {
    return {
      character: dbMessage.characterId,
      content: dbMessage.content,
      recipient: dbMessage.recipient,
      thoughts: dbMessage.thoughts,
      mood: dbMessage.mood,
      mood_emoji: dbMessage.moodEmoji,
      reaction_on_previous_message: dbMessage.reactionOnPrevious,
      timestamp: dbMessage.timestamp.toISOString(),
      unix_timestamp: dbMessage.timestamp.getTime(),
      calculated_speaking_time: dbMessage.calculatedSpeakingTime,
      conversation_rating: dbMessage.conversationRating,
      end_conversation: dbMessage.endConversation ?? false,
    };
  }

  /**
   * Wait until all characters have completed a specific action type
   */
  async waitUntilAllCharactersCompletedAction(
    sceneState: SceneState,
    actionType: CharacterAction = 'speaking',
  ): Promise<void> {
    if (!sceneState?.characters) return;
    let stillActing = true;
    while (stillActing) {
      stillActing = false;
      const now = Date.now();
      const characters = sceneState.characters;
      for (const charId in characters) {
        const char = characters[charId];
        if (!char) continue;
        const startedAt =
          typeof char.action_started_at === 'number' ? char.action_started_at : null;
        const duration =
          typeof char.action_estimated_duration === 'number'
            ? char.action_estimated_duration
            : null;

        if (char.action === actionType && duration !== null && startedAt !== null) {
          const endTime = startedAt + duration * 1000;
          if (now < endTime) {
            stillActing = true;
            const waitTime = endTime - now;
            this.logger.trace(
              `Character ${charId} still ${actionType}, waiting ${waitTime.toFixed(0)}ms`,
            );
            await new Promise((resolve) => setTimeout(resolve, Math.max(50, waitTime)));
            break; // Re-check all characters after waiting
          } else {
            this.logger.trace(`Character ${charId} finished ${actionType}. Setting idle.`);
            await this.setCharacterAction(charId, 'idle', undefined);
          }
        }
      }
      // Only pause if we didn't break the inner loop to wait
      if (stillActing) await new Promise((resolve) => setTimeout(resolve, 50));
    }
    this.logger.debug(`All characters finished ${actionType}.`);
  }
}
