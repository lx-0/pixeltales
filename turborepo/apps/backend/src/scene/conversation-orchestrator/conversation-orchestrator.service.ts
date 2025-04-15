import { AIMessage, HumanMessage } from '@langchain/core/messages';
import { Inject, Injectable } from '@nestjs/common';
import {
  CharacterAction,
  DBMessage,
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
import { SceneStateService } from '../scene-state/scene-state.service';

// Constants moved from SceneManagerService
const BASE_PAUSE_TIME_MS = 5000; // 5 seconds
const END_CONVERSATION_REQUEST_VALIDITY_S = 180; // 3 minutes

@Injectable()
export class ConversationOrchestratorService {
  constructor(
    @Inject(DRIZZLE_INSTANCE) private readonly db: DrizzleSqliteDatabase,
    private readonly logger: PinoLogger,
    private readonly llmService: LlmService,
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
          this.logger.error('Mapped message failed Zod validation', parsedMessage.error.flatten());
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
      this.logger.error('Error in conversation step', error);
      throw error;
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

    try {
      // Set character to thinking state
      await this._setCharacterAction(characterId, 'thinking', undefined);
      this.logger.info(`Generating message for ${characterId}...`);

      // Prepare conversation history
      const history = this._prepareConversationHistory(sceneState, characterId);

      // Prepare system message with context
      const systemVars = this._prepareSystemMessage(
        sceneState,
        sceneConfig,
        characterId,
        recipientId,
      );

      // Generate response using LLM service
      const response = await this.llmService.generateResponse(characterId, {
        ...systemVars,
        history: history,
      });

      this.logger.debug(`Generated response for ${characterId}: ${JSON.stringify(response)}`);

      // Calculate speaking time based on content length
      const content = response.content || '';
      const speakingTimeMs = this._calculateSpeakingTime(content.length);
      const nowTimestamp = Date.now();

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
        tokenCount: null, // TODO: Add token counting
        cost: null, // TODO: Add cost calculation
      };

      // Save message to database
      // eslint-disable-next-line @typescript-eslint/await-thenable
      const insertedMessage: DBMessage = await this.db
        .insert(dbSchema.messagesTable)
        .values(newMessageData)
        .returning()
        .get();
      this.logger.info(`Saved message ${insertedMessage.id} from ${characterId}`);

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
    } catch (error) {
      this.logger.error(`Failed to generate or save message for character ${characterId}`, error);
      await this._setCharacterAction(characterId, 'idle', undefined);
      return null;
    }
  }

  /**
   * Prepare conversation history for LLM context
   */
  private _prepareConversationHistory(
    sceneState: SceneState,
    characterId: string,
  ): Array<HumanMessage | AIMessage> {
    const history: Array<HumanMessage | AIMessage> = [];
    const contextWindow = 20; // Keep last 20 messages for context

    // Extract recent messages
    const recentMessages = sceneState.messages.slice(-contextWindow);

    // Convert to LangChain message format
    for (const msg of recentMessages) {
      if (msg.character !== characterId) {
        // Message from other characters -> Human message from this character's perspective
        history.push(new HumanMessage(msg.content || ''));
      } else {
        // Message from this character -> AI message from this character's perspective
        history.push(new AIMessage(msg.content || ''));
      }
    }

    return history;
  }

  /**
   * Prepare system message with context
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
            ? 'Start a conversation.'
            : 'Continue the conversation naturally.',
        conversation_length: sceneState.messages.length.toString(),
        current_time: new Date().toLocaleTimeString(),
      };
    }

    // Get scene description and character descriptions
    const charactersDescription = Object.values(sceneState.characters)
      .map((char) => `- ${char?.visual || 'A character'}`)
      .join('\n');

    const sceneDescription = `${sceneConfig.config.description}\n\nCharacters:\n${charactersDescription}`;

    // Determine if this is the first message or a continuation
    const input =
      sceneState.messages.length === 0
        ? 'Start a conversation.'
        : 'Continue the conversation naturally.';

    // Return template variables
    return {
      character_name: character.name,
      character_visual: character.visual || '',
      character_role: character.role || '',
      message_recipient: recipientId || '',
      scene_description: sceneDescription,
      input: input,
      conversation_length: sceneState.messages.length.toString(),
      current_time: new Date().toLocaleTimeString(),
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
