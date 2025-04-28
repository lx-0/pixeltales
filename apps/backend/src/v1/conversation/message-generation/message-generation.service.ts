import { AIMessage, HumanMessage } from '@langchain/core/messages';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CharacterAction,
  Message,
  MessageV2,
  NewMessageV2,
  SceneConfig,
  SceneStateSnapshot,
} from '@pixeltales/contracts';
import { LOGGER_CONTEXT_SHORTEN } from '@yesterday-ai/logger-backend';
import { randomUUID } from 'crypto';
import { PinoLogger } from 'nestjs-pino';
import { ConversationSystemMessageVars, LlmService } from '../../llm/llm.service';
import { SceneStateService } from '../../scene/scene-state/scene-state.service';
import { MessagesDbService } from '../conversation-db/messages-db.service';

// Constants
const END_CONVERSATION_REQUEST_VALIDITY_S = 180; // 3 minutes
const SPEAKING_TIME_DELAY_FACTOR = 2; // double the delay (base is 5 seconds)
const SPEAKING_TIME_FACTOR = 3; // triple the speaking time (base is 50ms per character)

@Injectable()
export class MessageGenerationService {
  private debugLogging: boolean;

  constructor(
    private readonly messagesDb: MessagesDbService,
    private readonly logger: PinoLogger,
    private readonly llmService: LlmService,
    private readonly sceneStateService: SceneStateService,
    private readonly configService: ConfigService,
  ) {
    this.logger.setContext(LOGGER_CONTEXT_SHORTEN ? '💬' : MessageGenerationService.name);
    this.debugLogging = this.configService.get('DEBUG_CHARACTER_ACTIONS') === 'true';
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
    sceneState: SceneStateSnapshot,
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
    const characterConfig = sceneConfig.charactersConfig[characterId];
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
        const llmConfig = characterConfig.llmConfig;

        // Call the LLM to generate a response
        this.logger.info(
          {
            traceId,
            characterId,
            characterName: character.name,
            historyLength: conversationHistory.length,
            provider: llmConfig.provider,
            model: llmConfig.modelName,
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
        if (!content && !response.endConversation) {
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
          sceneId: sceneState.sceneId,
          characterId: characterId,
          content: content,
          thoughts: response.thoughts,
          mood: response.mood,
          moodEmoji: response.moodEmoji,
          modelUsed: llmConfig.modelName,
          recipient: response.recipient || recipientId || '',
          reactionOnPreviousMessage: response.reactionOnPreviousMessage || null,
          calculatedSpeakingTime: speakingTimeMs / 1000,
          endConversation: response.endConversation,
          conversationRating: response.conversationRating,
          tokenCount: totalTokensUsed,
          cost: null, // TODO: Add cost calculation later
        };

        // Create a state message (for legacy support) from the data needed for a Message
        const stateMessage: Message = {
          characterId: characterId,
          content: content,
          timestamp: new Date(nowTimestamp),
          thoughts: response.thoughts,
          mood: response.mood,
          moodEmoji: response.moodEmoji,
          recipient: response.recipient || recipientId || '',
          reactionOnPreviousMessage: response.reactionOnPreviousMessage || null,
          calculatedSpeakingTime: speakingTimeMs / 1000,
          conversationRating: response.conversationRating,
          endConversation: response.endConversation,
        };

        // Always add the message to the scene state first
        await this.sceneStateService.addMessageToState(stateMessage);

        // Update character state
        await this.sceneStateService.updateCharacterState(characterId, {
          currentMood: response.mood,
          endConversationRequested: response.endConversation,
          endConversationRequestedAt: response.endConversation ? new Date(nowTimestamp) : undefined,
          endConversationRequestedValidityDuration: response.endConversation
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

  private prepareSceneContext(sceneConfig: SceneConfig, sceneState: SceneStateSnapshot): string {
    // Build rich description of all characters in the scene
    const charactersDescription = this.prepareCharactersContext(sceneState);

    return [sceneConfig.description, '', 'Characters:', charactersDescription].join('\n');
  }

  private prepareCharactersContext(sceneState: SceneStateSnapshot): string {
    return Object.values(sceneState.characters)
      .map((char) => {
        if (!char) return '';
        // For each character, include more details if available
        const details = [];
        if (char.visual) details.push(char.visual);
        if (char.currentMood) details.push(`Current mood: ${char.currentMood}`);
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
    sceneState: SceneStateSnapshot,
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
      input: input,
      current_time: new Date().toLocaleTimeString(),
      conversation_length: sceneState.messages.length.toString(),
      scene_description: sceneDescription,
      message_recipient: recipientInfo || '',
      character_name: character.name,
      character_visual: character.visual,
      character_role: character.role,
      // Add character-specific context if available
      character_mood: character.currentMood,
    };
  }

  /**
   * Calculate speaking time based on message length
   */
  calculateSpeakingTime(messageLength: number): number {
    const baseSpeakingTime = 5000 * SPEAKING_TIME_DELAY_FACTOR; // 5 seconds base time
    const charSpeakingTime = 50 * SPEAKING_TIME_FACTOR; // 50ms per character

    return baseSpeakingTime + messageLength * charSpeakingTime;
  }

  /**
   * Set a character's action
   */
  async setCharacterAction(
    characterId: string,
    action: CharacterAction,
    estimatedDurationMs?: number,
  ): Promise<SceneStateSnapshot> {
    const character = this.sceneStateService.getCharacterState(characterId);
    const previousAction = character?.action;
    const previousStarted = character?.actionStartedAt;

    if (this.debugLogging) {
      this.logger.debug(
        {
          characterId,
          action,
          estimatedDurationMs,
          previousAction,
          previousStarted,
          now: Date.now(),
          allCharacters: this.getAllCharactersStatus(),
        },
        `🔄 CHANGING character ${characterId} action: ${previousAction} → ${action}`,
      );
    } else {
      this.logger.debug(`Setting action for ${characterId}: ${action}`);
    }

    await this.sceneStateService.updateCharacterState(characterId, {
      action: action,
      actionStartedAt: new Date(),
      actionEstimatedDuration: estimatedDurationMs ? estimatedDurationMs / 1000 : undefined,
    });

    if (this.debugLogging) {
      const updatedCharacter = this.sceneStateService.getCharacterState(characterId);
      this.logger.debug(
        {
          characterId,
          updatedAction: updatedCharacter?.action,
          updatedStarted: updatedCharacter?.actionStartedAt,
          estimatedDuration: updatedCharacter?.actionEstimatedDuration,
        },
        `✅ UPDATED character ${characterId} action to ${action}`,
      );
    }

    const currentState = this.sceneStateService.getCurrentState();
    if (!currentState) {
      this.logger.error('No scene state found');
      throw new Error('No scene state found');
    }
    return currentState;
  }

  /**
   * Convert a DBMessage to a state Message
   */
  mapMessageV2ToStateMessage(messageV2: MessageV2): Message {
    return {
      characterId: messageV2.characterId,
      content: messageV2.content,
      recipient: messageV2.recipient,
      thoughts: messageV2.thoughts,
      mood: messageV2.mood,
      moodEmoji: messageV2.moodEmoji,
      reactionOnPreviousMessage: messageV2.reactionOnPreviousMessage,
      timestamp: messageV2.timestamp,
      calculatedSpeakingTime: messageV2.calculatedSpeakingTime,
      conversationRating: messageV2.conversationRating,
      endConversation: messageV2.endConversation ?? false,
    };
  }

  /**
   * Wait until all characters have completed a specific action type
   */
  async waitUntilAllCharactersCompletedAction(
    sceneState: SceneStateSnapshot,
    actionType: CharacterAction = 'speaking',
  ): Promise<SceneStateSnapshot> {
    if (!sceneState?.characters) {
      const currentState = this.sceneStateService.getCurrentState();
      if (!currentState) {
        this.logger.error('No scene state found');
        throw new Error('No scene state found');
      }
      return currentState;
    }

    if (this.debugLogging) {
      this.logger.debug(
        { actionType, characters: this.getAllCharactersStatus(sceneState) },
        `⏳ Starting wait for all characters to complete ${actionType} action`,
      );
    }

    let stillActing = true;
    let iterations = 0;

    while (stillActing) {
      iterations++;
      stillActing = false;
      const now = Date.now();
      const characters = sceneState.characters;

      if (this.debugLogging && iterations % 10 === 0) {
        this.logger.debug(
          { actionType, iterations, characters: this.getAllCharactersStatus(sceneState) },
          `⌛ Still waiting for characters to complete ${actionType} action (iteration ${iterations})`,
        );
      }

      for (const charId in characters) {
        const char = characters[charId];
        if (!char) continue;
        const duration =
          typeof char.actionEstimatedDuration === 'number' ? char.actionEstimatedDuration : null;

        if (char.action === actionType && duration !== null) {
          const endTime = char.actionStartedAt.getTime() + duration * 1000;
          if (now < endTime) {
            stillActing = true;
            const waitTime = endTime - now;
            if (this.debugLogging) {
              this.logger.debug(
                {
                  characterId: charId,
                  actionType,
                  waitTime: waitTime.toFixed(0),
                  endTime,
                  now,
                  startedAt: char.actionStartedAt,
                  duration,
                },
                `⏱️ Character ${charId} still ${actionType}, waiting ${waitTime.toFixed(0)}ms until ${new Date(endTime).toISOString()}`,
              );
            } else {
              this.logger.trace(
                `Character ${charId} still ${actionType}, waiting ${waitTime.toFixed(0)}ms`,
              );
            }
            await new Promise((resolve) => setTimeout(resolve, Math.max(50, waitTime)));
            break; // Re-check all characters after waiting
          } else {
            if (this.debugLogging) {
              this.logger.debug(
                {
                  characterId: charId,
                  actionType,
                  elapsedTime: now - char.actionStartedAt.getTime(),
                  expectedDuration: duration * 1000,
                  now,
                  startedAt: char.actionStartedAt,
                },
                `⌛ Character ${charId} finished ${actionType}. Setting idle.`,
              );
            } else {
              this.logger.trace(`Character ${charId} finished ${actionType}. Setting idle.`);
            }
            await this.setCharacterAction(charId, 'idle', undefined);
          }
        }
      }
      // Only pause if we didn't break the inner loop to wait
      if (stillActing) await new Promise((resolve) => setTimeout(resolve, 50));
    }

    if (this.debugLogging) {
      this.logger.debug(
        { actionType, iterations, characters: this.getAllCharactersStatus(sceneState) },
        `✅ All characters finished ${actionType} after ${iterations} iterations.`,
      );
    } else {
      this.logger.debug(`All characters finished ${actionType}.`);
    }

    const currentState = this.sceneStateService.getCurrentState();
    if (!currentState) {
      this.logger.error('No scene state found');
      throw new Error('No scene state found');
    }
    return currentState;
  }

  /**
   * Debug: Helper method to get a summary of all characters' statuses
   */
  private getAllCharactersStatus(state?: SceneStateSnapshot): Record<
    string,
    {
      name: string;
      action: CharacterAction;
      started: Date;
      duration?: number | null;
      remainingMs: number;
      isActive: boolean;
    }
  > {
    const sceneState = state || this.sceneStateService.getCurrentState();
    if (!sceneState?.characters) return {};

    const now = Date.now();
    const result: Record<
      string,
      {
        name: string;
        action: CharacterAction;
        started: Date;
        duration?: number | null;
        remainingMs: number;
        isActive: boolean;
      }
    > = {};

    for (const [id, char] of Object.entries(sceneState.characters)) {
      const endTime = char.actionStartedAt.getTime() + (char.actionEstimatedDuration || 0) * 1000;
      result[id] = {
        name: char.name,
        action: char.action,
        started: char.actionStartedAt,
        duration: char.actionEstimatedDuration,
        remainingMs: endTime > now ? endTime - now : 0,
        isActive: char.action !== 'idle' && endTime > now,
      };
    }

    return result;
  }
}
