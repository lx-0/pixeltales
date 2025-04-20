import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SceneConfig, SceneStateSnapshot } from '@pixeltales/contracts';
import { PinoLogger } from 'nestjs-pino';
import { LOGGER_CONTEXT_SHORTEN } from 'src/common/logger/logger.const';
import { millisecondsToReadableDuration } from 'src/common/utils';
import { LlmService } from '../../llm/llm.service';
import { ConversationHistoryService } from '../conversation-history/conversation-history.service';
import { ConversationStateService } from '../conversation-state/conversation-state.service';
import { MessageGenerationService } from '../message-generation/message-generation.service';

// Constants
const BASE_PAUSE_TIME_MS = 3 * 1000; // 3 minutes (productive shall be 5 seconds)
const THINKING_TIME_MS = 1 * 60 * 1000; // 1 minute (TODO make calculation more dynamic)

@Injectable()
export class ConversationOrchestratorService {
  private debugLogging: boolean;

  constructor(
    private readonly logger: PinoLogger,
    private readonly llmService: LlmService,
    private readonly messageGenerationService: MessageGenerationService,
    private readonly conversationHistoryService: ConversationHistoryService,
    private readonly conversationStateService: ConversationStateService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.setContext(LOGGER_CONTEXT_SHORTEN ? '👥' : ConversationOrchestratorService.name);
    this.debugLogging = this.configService.get('DEBUG_CONVERSATION_STEPS') === 'true';
  }

  initConversation(sceneConfig: SceneConfig): void {
    this.logger.info('Initializing conversation...');
    this.llmService.initScene(sceneConfig);
  }

  /**
   * Executes a single step of the active conversation.
   * Assumes restart logic/cooldown is handled *before* calling this.
   * Requires the current scene state and config to be passed in.
   */
  async runConversationStep(
    sceneState: SceneStateSnapshot,
    sceneConfig: SceneConfig,
  ): Promise<void> {
    if (!sceneState || !sceneConfig || !sceneState.conversationActive) {
      this.logger.trace(
        'runConversationStep called with inactive/missing state or config, skipping.',
      );
      return;
    }

    let currentState: SceneStateSnapshot | null = sceneState;

    try {
      if (this.debugLogging) {
        const characterStates = this.getCharacterStatesDebugInfo(currentState);
        this.logger.debug(
          {
            currentCharacterStates: characterStates,
            conversationActive: currentState.conversationActive,
            messageCount: currentState.messages.length,
            lastMessageTimestamp:
              currentState.messages.length > 0
                ? currentState.messages[currentState.messages.length - 1]?.timestamp
                : null,
          },
          `🎬 STARTING conversation step with ${Object.keys(characterStates).length} characters`,
        );
      } else {
        this.logger.debug('Running conversation step...');
      }

      // 1. Wait for characters to complete previous actions
      if (this.debugLogging) {
        this.logger.debug('Waiting for speaking characters to finish...');
      }
      currentState = await this.messageGenerationService.waitUntilAllCharactersCompletedAction(
        currentState,
        'speaking',
      );

      if (this.debugLogging) {
        this.logger.debug('Waiting for thinking characters to finish...');
      }
      currentState = await this.messageGenerationService.waitUntilAllCharactersCompletedAction(
        currentState,
        'thinking',
      );

      if (this.debugLogging) {
        const characterStatesAfterWait = this.getCharacterStatesDebugInfo(currentState);
        this.logger.debug(
          { characterStates: characterStatesAfterWait },
          `⌛ Character states after waiting for actions to complete`,
        );
      }

      // Emit event after waiting for actions
      this.eventEmitter.emit('scene.state.updated');

      // 2. Pause after actions complete before next step
      if (this.debugLogging) {
        this.logger.debug(
          `Pausing for ${millisecondsToReadableDuration(BASE_PAUSE_TIME_MS)} before next step...`,
        );
      }
      await new Promise((resolve) => setTimeout(resolve, BASE_PAUSE_TIME_MS));

      // 3. Check if state is still active after pause
      if (!currentState?.conversationActive) {
        this.logger.debug('Conversation became inactive during pause, skipping step.');
        return;
      }

      // 4. Determine next speaker and recipient
      const nextSpeakerId = this.conversationStateService.getNextSpeaker(currentState, sceneConfig);
      if (!nextSpeakerId) {
        this.logger.warn('Could not determine next speaker.');
        return;
      }
      const recipientId = this.conversationStateService.getOtherCharacterId(
        currentState,
        nextSpeakerId,
      );

      // 4.1. Wait for speaker to finish thinking
      currentState = await this.messageGenerationService.setCharacterAction(
        nextSpeakerId,
        'thinking',
        THINKING_TIME_MS, // TODO: Make thinking time based on length of previous message plus base plus character specific factor
      );
      await this.messageGenerationService.waitUntilAllCharactersCompletedAction(
        currentState,
        'thinking',
      );

      if (this.debugLogging) {
        const speakerChar = currentState.characters[nextSpeakerId];
        const recipientChar = recipientId ? currentState.characters[recipientId] : null;
        this.logger.debug(
          {
            nextSpeakerId,
            speakerName: speakerChar?.name,
            recipientId,
            recipientName: recipientChar?.name,
          },
          `👤 Next speaker: ${speakerChar?.name || 'unknown'} (${nextSpeakerId || 'unknown'}), Recipient: ${recipientChar?.name || 'none'} (${recipientId || 'none'})`,
        );
      } else {
        this.logger.info(`Next speaker: ${nextSpeakerId}`);
      }

      // 5. Prepare conversation history for the next speaker
      const conversationHistory = this.conversationHistoryService.prepareConversationHistory(
        currentState,
        nextSpeakerId,
        sceneConfig,
        sceneConfig.charactersConfig[nextSpeakerId]?.llmConfig?.provider,
      );

      if (this.debugLogging) {
        this.logger.debug(
          {
            historyLength: conversationHistory.length,
            speakerId: nextSpeakerId,
            recipientId,
          },
          `🔄 Prepared conversation history with ${conversationHistory.length} messages`,
        );
      }

      // 6. Generate message
      const newMessage = await this.messageGenerationService.generateMessage(
        currentState,
        sceneConfig,
        nextSpeakerId,
        recipientId,
        conversationHistory,
      );
      if (!newMessage) {
        this.logger.error(`Failed to generate message for ${nextSpeakerId}`);
      } else if (this.debugLogging) {
        this.logger.debug(
          {
            messageId: newMessage.id,
            speakerId: nextSpeakerId,
            content:
              newMessage.content?.substring(0, 50) +
              (newMessage.content && newMessage.content.length > 50 ? '...' : ''),
            mood: newMessage.mood,
            endConversationRequested: newMessage.endConversation,
            speakingTime: newMessage.calculatedSpeakingTime,
          },
          `✅ Generated message for ${nextSpeakerId}: "${newMessage.content?.substring(0, 50)}${newMessage.content && newMessage.content.length > 50 ? '...' : ''}"`,
        );
      }

      // TODO: refresh `currentState` after generating message

      // 7. Handle end conversation requests
      await this.conversationStateService.handleEndConversationRequests(currentState);

      // TODO: refresh `currentState` after handling end requests

      if (this.debugLogging) {
        const finalCharacterStates = this.getCharacterStatesDebugInfo(currentState);
        this.logger.debug(
          { finalCharacterStates },
          `🏁 Completed conversation step with final character states`,
        );
      }
    } catch (error) {
      // Log the actual error object for better debugging
      this.logger.error({ err: error }, 'Error caught in conversation step');
      throw error; // Re-throw the error to propagate it
    }
  }

  /**
   * Helper method to get debug info about character states
   */
  private getCharacterStatesDebugInfo(state: SceneStateSnapshot): Record<string, any> {
    const result: Record<string, any> = {};
    const now = Date.now();

    for (const [id, char] of Object.entries(state.characters)) {
      const endTime = char.actionStartedAt + (char.actionEstimatedDuration || 0) * 1000;
      result[id] = {
        name: char.name,
        action: char.action,
        started: char.actionStartedAt,
        startedAt: new Date(char.actionStartedAt).toISOString(),
        duration: char.actionEstimatedDuration,
        endTime: endTime > 0 ? new Date(endTime).toISOString() : null,
        remainingMs: endTime > now ? endTime - now : 0,
        isActive: char.action !== 'idle' && endTime > now,
        mood: char.currentMood,
        endConvRequested: char.endConversationRequested,
      };
    }

    return result;
  }
}
