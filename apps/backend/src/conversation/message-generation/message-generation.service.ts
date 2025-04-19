import { AIMessage, HumanMessage } from '@langchain/core/messages';
import { Injectable } from '@nestjs/common';
import {
  CharacterAction,
  Message,
  MessageV2,
  NewMessageV2,
  SceneConfig,
  SceneStateSnapshotState,
} from '@pixeltales/contracts';
import { randomUUID } from 'crypto';
import { PinoLogger } from 'nestjs-pino';
import { ConversationSystemMessageVars, LlmService } from '../../llm/llm.service';
import { SceneStateService } from '../../scene/scene-state/scene-state.service';
import { MessagesDbService } from '../conversation-db/messages-db.service';

// Constants
const END_CONVERSATION_REQUEST_VALIDITY_S = 180; // 3 minutes
const SPEAKING_TIME_DELAY_FACTOR = 12 * 5; // 5 min delay (base is 5 seconds)

@Injectable()
export class MessageGenerationService {
  constructor(
    private readonly messagesDb: MessagesDbService,
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
    sceneState: SceneStateSnapshotState,
    sceneConfig: SceneConfig,
    characterId: string,
    recipientId: string | undefined,
    conversationHistory: Array<HumanMessage | AIMessage>,
  ): Promise<MessageV2 | null> {
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
        const systemMessageVars = this.prepareSystemMessage(
          sceneState,
          sceneConfig,
          characterId,
          recipientId,
        );
        const llmConfig = characterConfig.llm_config;

        // Call the LLM to generate a response
        this.logger.info(
          {
            traceId,
            characterId,
            characterName: character.name,
            historyLength: conversationHistory.length,
            provider: llmConfig.provider,
            model: llmConfig.model_name,
          },
          `Generating AI response for character ${character.name}`,
        );

        const response = await this.llmService.generateResponse(llmConfig, {
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
        const newMessageData: NewMessageV2 = {
          sceneId: sceneState.scene_id,
          characterId: characterId,
          content: content,
          thoughts: response.thoughts,
          mood: response.mood,
          moodEmoji: response.mood_emoji,
          modelUsed: llmConfig.model_name,
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
        await this.sceneStateService.addMessageToState(stateMessage);

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
          const insertedMessage = await this.messagesDb.create(newMessageData);

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
          continue;
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

  private prepareSceneContext(
    sceneConfig: SceneConfig,
    sceneState: SceneStateSnapshotState,
  ): string {
    // Build rich description of all characters in the scene
    const charactersDescription = this.prepareCharactersContext(sceneState);

    return [sceneConfig.config.description, '', 'Characters:', charactersDescription].join('\n');
  }

  private prepareCharactersContext(sceneState: SceneStateSnapshotState): string {
    return Object.values(sceneState.characters)
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
  }

  /**
   * Prepare system message with context
   * This creates a rich context for the LLM with scene details, character information,
   * and other relevant data to guide the response generation
   */
  prepareSystemMessage(
    sceneState: SceneStateSnapshotState,
    sceneConfig: SceneConfig,
    characterId: string,
    recipientId?: string,
  ): ConversationSystemMessageVars {
    // Get character info
    const character = sceneState.characters[characterId];
    if (!character) {
      this.logger.error(`Character ${characterId} not found in scene state.`);
      throw new Error(`Character ${characterId} not found in scene state.`);
    }

    // Create complete scene description with environment and characters
    const sceneDescription = this.prepareSceneContext(sceneConfig, sceneState);

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
    const recipientInfo = recipientId && sceneState.characters[recipientId]?.name;

    // Return comprehensive template variables
    return {
      character_name: character.name,
      character_visual: character.visual,
      character_role: character.role,
      message_recipient: recipientInfo || '',
      scene_description: sceneDescription,
      input: input,
      conversation_length: sceneState.messages.length.toString(),
      current_time: new Date().toLocaleTimeString(),
      // Add character-specific context if available
      character_mood: character.current_mood,
    };
  }

  /**
   * Calculate speaking time based on message length
   */
  calculateSpeakingTime(messageLength: number): number {
    const baseSpeakingTime = 5000 * SPEAKING_TIME_DELAY_FACTOR; // 5 seconds base time
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
  mapMessageV2ToStateMessage(messageV2: MessageV2): Message {
    return {
      character: messageV2.characterId,
      content: messageV2.content,
      recipient: messageV2.recipient,
      thoughts: messageV2.thoughts,
      mood: messageV2.mood,
      mood_emoji: messageV2.moodEmoji,
      reaction_on_previous_message: messageV2.reactionOnPrevious,
      timestamp: messageV2.timestamp.toISOString(),
      unix_timestamp: messageV2.timestamp.getTime(),
      calculated_speaking_time: messageV2.calculatedSpeakingTime,
      conversation_rating: messageV2.conversationRating,
      end_conversation: messageV2.endConversation ?? false,
    };
  }

  /**
   * Wait until all characters have completed a specific action type
   */
  async waitUntilAllCharactersCompletedAction(
    sceneState: SceneStateSnapshotState,
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
