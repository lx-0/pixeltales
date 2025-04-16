import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { Inject, Injectable } from '@nestjs/common';
import {
  CharacterAction,
  DBMessage,
  LLMProviderId,
  Message,
  MessageSchema,
  NewDBMessage,
  SceneState,
} from '@pixeltales/contracts';
import { DBSceneConfig, dbSchema } from '@pixeltales/database';
import { randomUUID } from 'crypto';
import { PinoLogger } from 'nestjs-pino';
import { DRIZZLE_INSTANCE, DrizzleSqliteDatabase } from '../../db/drizzle.provider';
import { LlmService } from '../../llm/llm.service';
import { TokenCounter } from '../../llm/token-counter';
import { SceneStateService } from '../scene-state/scene-state.service';

// Constants moved from SceneManagerService
const BASE_PAUSE_TIME_MS = 5000; // 5 seconds
const END_CONVERSATION_REQUEST_VALIDITY_S = 180; // 3 minutes

// Max token percentage to use in context window (safety margin)
const MAX_CONTEXT_WINDOW_PERCENT = 0.85;

@Injectable()
export class ConversationOrchestratorService {
  constructor(
    @Inject(DRIZZLE_INSTANCE) private readonly db: DrizzleSqliteDatabase,
    private readonly logger: PinoLogger,
    private readonly llmService: LlmService,
    private readonly tokenCounter: TokenCounter,
    private readonly sceneStateService: SceneStateService,
  ) {
    this.logger.setContext(ConversationOrchestratorService.name);
  }

  // --- Main Step Execution ---

  /**
   * Executes a single step of the active conversation.
   * Assumes restart logic/cooldown is handled *before* calling this.
   * Requires the current scene state and config to be passed in.
   */
  async runConversationStep(sceneState: SceneState, sceneConfig: DBSceneConfig): Promise<void> {
    if (!sceneState || !sceneConfig || !sceneState.conversation_active) {
      this.logger.trace(
        'runConversationStep called with inactive/missing state or config, skipping.',
      );
      return;
    }

    try {
      this.logger.debug('Running conversation step...');

      // 1. Wait for characters to finish previous actions
      await this._wait_until_all_characters_completed_action(sceneState, 'speaking');
      await this._wait_until_all_characters_completed_action(sceneState, 'thinking');

      // Pause after actions complete before next step
      await new Promise((resolve) => setTimeout(resolve, BASE_PAUSE_TIME_MS));

      // Re-check state after pauses (might have changed)
      const currentState = this.sceneStateService.getCurrentState();
      if (!currentState?.conversation_active) {
        this.logger.debug('Conversation became inactive during pause, skipping step.');
        return;
      }

      // 3. Determine next speaker
      const nextSpeakerId = this._get_next_speaker(currentState, sceneConfig);
      if (!nextSpeakerId) {
        this.logger.warn('Could not determine next speaker.');
        return;
      }
      const recipientId = this._getOtherCharacterId(currentState, nextSpeakerId);

      this.logger.info(`Next speaker: ${nextSpeakerId}`);

      // 4. Generate message (includes setting thinking, LLM call, saving message, setting speaking)
      const newMessage = await this._generateMessage(
        currentState,
        sceneConfig,
        nextSpeakerId,
        recipientId,
      );

      if (newMessage) {
        // Add message to state via SceneStateService
        const messageForState: Message = this._mapDBMessageToStateMessage(newMessage);
        const parsedMessage = MessageSchema.safeParse(messageForState);
        if (parsedMessage.success) {
          this.sceneStateService.updateState({
            messages: [...(currentState.messages ?? []), parsedMessage.data],
          });
        } else {
          this.logger.error(parsedMessage.error.flatten(), 'Mapped message failed Zod validation');
        }
      } else {
        this.logger.error(`Failed to generate or save message for ${nextSpeakerId}`);
      }

      // Re-check state after message generation
      const finalStateCheck = this.sceneStateService.getCurrentState();
      if (!finalStateCheck?.conversation_active) {
        this.logger.debug('Conversation became inactive during message generation, ending step.');
        return;
      }

      // 5. Handle end conversation requests
      await this._handle_end_conversation_requests(finalStateCheck);
    } catch (error) {
      // Log the actual error object for better debugging
      this.logger.error({ err: error }, 'Error caught in conversation step');
      throw error; // Re-throw the error to propagate it
    }
  }

  // --- Conversation Logic Helpers (Copied/Adapted from SceneManagerService) ---

  private _getOtherCharacterId(sceneState: SceneState, characterId: string): string | null {
    if (!sceneState) return null;
    const allIds = Object.keys(sceneState.characters);
    const otherIds = allIds.filter((id) => id !== characterId);
    if (otherIds.length === 0) return null;
    const chosenId = otherIds[Math.floor(Math.random() * otherIds.length)];
    return chosenId ?? null;
  }

  // Note: _getSceneConfig() is not needed here, config is passed into runConversationStep

  private async _generateMessage(
    sceneState: SceneState,
    sceneConfig: DBSceneConfig,
    characterId: string,
    recipientId: string | null,
  ): Promise<DBMessage | null> {
    const characterConfig = sceneConfig.config.characters_config[characterId];
    if (!sceneState || !sceneConfig || !characterConfig) {
      this.logger.error(`Could not generate message for ${characterId} - missing state or config`);
      return null;
    }

    // Retry settings
    const maxRetries = 3;
    let retryCount = 0;
    let backoffTime = 500; // Start with 500ms
    let lastError: Error | null = null;

    // Set character to thinking state
    await this._setCharacterAction(characterId, 'thinking', undefined);

    // Prepare conversation history and system message outside the retry loop
    // so we don't recreate them on each retry
    const history = this._prepareConversationHistory(
      sceneState,
      characterId,
      sceneConfig,
      characterConfig.llm_config.provider,
    );
    const systemVars = this._prepareSystemMessage(
      sceneState,
      sceneConfig,
      characterId,
      recipientId,
    );

    // Calculate token usage for this request
    const provider = characterConfig.llm_config.provider;
    const historyTokens = this.tokenCounter.estimateTokensForMessages(history, provider);

    // Convert system variables to messages for token counting
    const systemTokens = Object.entries(systemVars).reduce((total, [key, value]) => {
      return (
        total +
        this.tokenCounter.estimateTokensForMessage(new SystemMessage(`${key}: ${value}`), provider)
      );
    }, 0);

    const totalTokens = historyTokens + systemTokens;
    const maxTokens = characterConfig.llm_config.max_tokens;
    const contextWindow = this.tokenCounter.getContextWindow(
      characterConfig.llm_config.model_name,
      provider,
    );

    // Check if we're approaching context limit and log warnings
    const safeContextLimit = Math.floor(contextWindow * MAX_CONTEXT_WINDOW_PERCENT);
    if (totalTokens + maxTokens > contextWindow) {
      this.logger.warn(
        `Token limit exceeded: ${totalTokens} + ${maxTokens} > ${contextWindow}. Context will be truncated.`,
      );
    } else if (totalTokens + maxTokens > safeContextLimit) {
      this.logger.warn(
        `Approaching token limit: ${totalTokens} + ${maxTokens} > ${safeContextLimit} (${Math.round(MAX_CONTEXT_WINDOW_PERCENT * 100)}% of ${contextWindow})`,
      );
    } else {
      this.logger.debug(
        `Token usage: ${totalTokens} + ${maxTokens} <= ${contextWindow} (${Math.round(((totalTokens + maxTokens) / contextWindow) * 100)}% of context window)`,
      );
    }

    // Generate a trace ID to correlate all logs for this message generation
    const traceId = randomUUID().substring(0, 8);
    this.logger.info(
      { traceId, characterId, totalTokens },
      `Generating message for ${characterId}...`,
    );

    while (retryCount < maxRetries) {
      try {
        this.logger.debug(
          { traceId, attempt: retryCount + 1, maxRetries },
          `LLM call attempt ${retryCount + 1}/${maxRetries}`,
        );

        // Generate response using LLM service
        const response = await this.llmService.generateResponse(characterId, {
          ...systemVars,
          history: history,
        });

        this.logger.debug(
          { traceId, characterId },
          `Generated response for ${characterId}: ${JSON.stringify(response)}`,
        );

        // Calculate speaking time based on content length
        const content = response.content || '';
        const speakingTimeMs = this._calculateSpeakingTime(content.length);
        const nowTimestamp = Date.now();

        // Calculate token count for response
        const responseContent = response.content || '';
        const responseTokens = this.tokenCounter.estimateTokensForMessage(
          new AIMessage(responseContent),
          provider,
        );
        const totalTokensUsed = totalTokens + responseTokens;

        // Prepare message for database
        const newMessageData: NewDBMessage & { content: string } = {
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
          tokenCount: totalTokensUsed, // Include token count in the database record
          cost: null, // TODO: Add cost calculation later
        };

        // Save message to database
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
          await this._setCharacterAction(characterId, 'speaking', speakingTimeMs);

          return insertedMessage;
        } catch (dbError) {
          // Handle database errors separately
          this.logger.error(
            { traceId, err: dbError, characterId },
            `Failed to save message to database for character ${characterId}`,
          );
          throw dbError;
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
    await this._setCharacterAction(characterId, 'idle', undefined);

    return null;
  }

  /**
   * Prepare conversation history for LLM context
   * This formats previous messages in a way that helps the LLM understand
   * the conversation from the character's perspective
   *
   * @param sceneState Current scene state with messages
   * @param characterId ID of the character for which to prepare context
   * @param sceneConfig Optional scene configuration for token calculations
   * @param provider Optional provider ID for token calculations
   */
  private _prepareConversationHistory(
    sceneState: SceneState,
    characterId: string,
    sceneConfig?: DBSceneConfig,
    provider?: LLMProviderId,
  ): Array<HumanMessage | AIMessage> {
    const history: Array<HumanMessage | AIMessage> = [];

    // Get the character's info
    const character = sceneState.characters[characterId];
    if (!character) {
      this.logger.warn(`Character ${characterId} not found, cannot prepare context`);
      return history;
    }

    // Extract messages, handling empty arrays
    const messages = sceneState.messages || [];
    if (messages.length === 0) {
      this.logger.debug(`No message history for character ${characterId}`);
      return history;
    }

    // If we don't have a scene config or provider, fall back to a fixed context window
    if (!sceneConfig || !provider) {
      return this._prepareFixedWindowConversationHistory(messages, characterId, 20);
    }

    // Get character-specific LLM config if available
    const characterConfig = sceneConfig.config.characters_config[characterId];
    if (!characterConfig || !characterConfig.llm_config) {
      this.logger.warn(
        `No LLM config found for character ${characterId}, using default context window`,
      );
      return this._prepareFixedWindowConversationHistory(messages, characterId, 20);
    }

    const modelName = characterConfig.llm_config.model_name;
    const maxOutputTokens = characterConfig.llm_config.max_tokens;

    // Get model's context window size
    const contextWindowSize = this.tokenCounter.getContextWindow(modelName, provider);

    // Reserve tokens for:
    // 1. Model's max output tokens
    // 2. System prompt/instructions (rough estimate)
    // 3. Safety buffer (10%)
    const reservedTokens = maxOutputTokens + 500; // 500 is a rough estimate for system prompt
    const safetyBuffer = Math.floor(contextWindowSize * 0.1);
    const availableTokens = contextWindowSize - reservedTokens - safetyBuffer;

    // If we have a very limited token budget, use a minimal context
    if (availableTokens < 1000) {
      this.logger.warn(
        `Very limited token budget (${availableTokens}) for context, using minimal context`,
      );
      return this._prepareFixedWindowConversationHistory(messages, characterId, 5);
    }

    // Start with all messages and gradually reduce until we fit
    // First, convert all messages to LangChain format
    const allFormattedMessages = messages.map((msg) => {
      if (msg.character !== characterId) {
        // Message from other characters -> Human message from this character's perspective
        const sender = msg.character;
        const content = !msg.content ? '' : `${sender}: ${msg.content}`;
        return new HumanMessage(content);
      } else {
        // Message from this character -> AI message from this character's perspective
        return new AIMessage(msg.content || '');
      }
    });

    // Start with all messages and count tokens
    let currentMessages = [...allFormattedMessages];
    let currentTokenCount = this.tokenCounter.estimateTokensForMessages(currentMessages, provider);

    // If we're already under budget, return all messages
    if (currentTokenCount <= availableTokens) {
      this.logger.debug(
        `Using all ${currentMessages.length} messages (${currentTokenCount} tokens) for context`,
      );
      return currentMessages;
    }

    // Otherwise, we need to reduce context
    // Strategy: Remove messages from the middle, keeping recent ones and some early ones
    const recentMessageCount = Math.min(10, Math.floor(messages.length / 2));
    let keepEarlyCount = 2; // Keep at least the first 2 messages for context

    // Keep reducing until we fit or hit minimum context
    while (
      currentTokenCount > availableTokens &&
      currentMessages.length > recentMessageCount + keepEarlyCount
    ) {
      // Remove messages from the middle (after early ones, before recent ones)
      const earlyMessages = allFormattedMessages.slice(0, keepEarlyCount);
      const recentMessages = allFormattedMessages.slice(-recentMessageCount);

      // Create a new context with early and recent messages
      currentMessages = [...earlyMessages, ...recentMessages];
      currentTokenCount = this.tokenCounter.estimateTokensForMessages(currentMessages, provider);

      // If we still don't fit, reduce early messages (but keep at least 1)
      if (currentTokenCount > availableTokens && keepEarlyCount > 1) {
        keepEarlyCount--;
      } else {
        // If we still don't fit and have kept only 1 early message, start reducing recent messages
        if (currentTokenCount > availableTokens && recentMessageCount > 3) {
          // Remove one recent message at a time until we fit
          currentMessages.splice(keepEarlyCount, 1);
          currentTokenCount = this.tokenCounter.estimateTokensForMessages(
            currentMessages,
            provider,
          );
        } else {
          // If we're still over budget with minimal context, we have to force a smaller context
          this.logger.warn(
            `Couldn't fit context within token budget, forcing minimal context (${currentTokenCount} > ${availableTokens})`,
          );
          return this._prepareFixedWindowConversationHistory(messages, characterId, 5);
        }
      }
    }

    this.logger.debug(
      `Using ${currentMessages.length} messages (${currentTokenCount} tokens) for context window`,
    );

    return currentMessages;
  }

  /**
   * Fallback method that prepares conversation history with a fixed window size
   */
  private _prepareFixedWindowConversationHistory(
    messages: Message[],
    characterId: string,
    windowSize: number,
  ): Array<HumanMessage | AIMessage> {
    const history: Array<HumanMessage | AIMessage> = [];

    // Get last N messages
    const recentMessages = messages.slice(-windowSize);

    this.logger.debug(`Using fixed window of ${recentMessages.length} messages for ${characterId}`);

    // Convert to LangChain message format
    for (const msg of recentMessages) {
      if (!msg.content) continue; // Skip empty messages

      if (msg.character !== characterId) {
        // Message from other characters -> Human message from this character's perspective
        const sender = msg.character;
        const formattedContent = `${sender}: ${msg.content}`;
        history.push(new HumanMessage(formattedContent));
      } else {
        // Message from this character -> AI message from this character's perspective
        history.push(new AIMessage(msg.content));
      }
    }

    return history;
  }

  /**
   * Prepare system message with context
   * This creates a rich context for the LLM with scene details, character information,
   * and other relevant data to guide the response generation
   */
  private _prepareSystemMessage(
    sceneState: SceneState,
    sceneConfig: DBSceneConfig,
    characterId: string,
    recipientId: string | null,
  ): Record<string, string> {
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
  private _calculateSpeakingTime(messageLength: number): number {
    const baseSpeakingTime = 5000; // 5 seconds base time
    const charSpeakingTime = 50; // 50ms per character

    return baseSpeakingTime + messageLength * charSpeakingTime;
  }

  private _get_next_speaker(sceneState: SceneState, sceneConfig: DBSceneConfig): string | null {
    if (!sceneState || !sceneConfig) return null;

    if (!sceneState.messages || sceneState.messages.length === 0) {
      return sceneConfig.config.start_character_id;
    }
    const lastMessage = sceneState.messages?.[sceneState.messages.length - 1];
    if (!lastMessage)
      return this._getOtherCharacterId(sceneState, sceneConfig.config.start_character_id);
    return this._getOtherCharacterId(sceneState, lastMessage.character);
  }

  private async _wait_until_all_characters_completed_action(
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
            await this._setCharacterAction(charId, 'idle', undefined);
          }
        }
      }
      // Only pause if we didn't break the inner loop to wait
      if (stillActing) await new Promise((resolve) => setTimeout(resolve, 50));
    }
    this.logger.debug(`All characters finished ${actionType}.`);
  }

  private async _handle_end_conversation_requests(sceneState: SceneState): Promise<boolean> {
    if (!sceneState?.characters) return false;
    const now = Date.now();
    let all_agreed = true;
    let changed = false;
    const characters = sceneState.characters;

    for (const charId in characters) {
      const char = characters[charId];
      if (!char) continue;
      const requestedAt =
        typeof char.end_conversation_requested_at === 'number'
          ? char.end_conversation_requested_at
          : null;
      const validityDuration =
        typeof char.end_conversation_requested_validity_duration === 'number'
          ? char.end_conversation_requested_validity_duration
          : null;

      if (char.end_conversation_requested && requestedAt !== null && validityDuration !== null) {
        if (now > requestedAt + validityDuration * 1000) {
          this.logger.info(`End request for ${charId} expired.`);
          this.sceneStateService.updateCharacterState(charId, {
            end_conversation_requested: false,
            end_conversation_requested_at: undefined,
            end_conversation_requested_validity_duration: undefined,
          });
          changed = true;
          all_agreed = false;
        }
      } else {
        all_agreed = false;
      }
    }

    if (all_agreed && Object.keys(characters).length > 0) {
      this.logger.info('All characters agreed to end conversation.');
      this.sceneStateService.updateState({
        conversation_active: false,
        conversation_ended: true,
        ended_at: Date.now(),
      });
      changed = true;
    }

    return changed;
  }

  // --- Internal Helpers ---

  private async _setCharacterAction(
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

  private _mapDBMessageToStateMessage(dbMessage: DBMessage): Message {
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
}
