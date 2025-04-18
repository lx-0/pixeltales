import { Injectable } from '@nestjs/common';
import { SceneConfig, SceneConfigConfig, SceneStateSnapshotState } from '@pixeltales/database';
import { PinoLogger } from 'nestjs-pino';
import { LlmService } from '../../llm/llm.service';
import { ConversationHistoryService } from '../conversation-history/conversation-history.service';
import { ConversationStateService } from '../conversation-state/conversation-state.service';
import { MessageGenerationService } from '../message-generation/message-generation.service';

// Constants
const BASE_PAUSE_TIME_MS = 5000; // 5 seconds

@Injectable()
export class ConversationOrchestratorService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly llmService: LlmService,
    private readonly messageGenerationService: MessageGenerationService,
    private readonly conversationHistoryService: ConversationHistoryService,
    private readonly conversationStateService: ConversationStateService,
  ) {
    this.logger.setContext(ConversationOrchestratorService.name);
  }

  initConversation(sceneConfig: SceneConfigConfig): void {
    this.logger.info('Initializing conversation...');
    this.llmService.initScene(sceneConfig);
  }

  /**
   * Executes a single step of the active conversation.
   * Assumes restart logic/cooldown is handled *before* calling this.
   * Requires the current scene state and config to be passed in.
   */
  async runConversationStep(
    sceneState: SceneStateSnapshotState,
    sceneConfig: SceneConfig,
  ): Promise<void> {
    if (!sceneState || !sceneConfig || !sceneState.conversation_active) {
      this.logger.trace(
        'runConversationStep called with inactive/missing state or config, skipping.',
      );
      return;
    }

    try {
      this.logger.debug('Running conversation step...');

      // 1. Wait for characters to complete previous actions
      await this.messageGenerationService.waitUntilAllCharactersCompletedAction(
        sceneState,
        'speaking',
      );
      await this.messageGenerationService.waitUntilAllCharactersCompletedAction(
        sceneState,
        'thinking',
      );

      // 2. Pause after actions complete before next step
      await new Promise((resolve) => setTimeout(resolve, BASE_PAUSE_TIME_MS));

      // 3. Check if state is still active after pause
      const currentState = sceneState;
      if (!currentState?.conversation_active) {
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

      this.logger.info(`Next speaker: ${nextSpeakerId}`);

      // 5. Prepare conversation history
      const conversationHistory = this.conversationHistoryService.prepareConversationHistory(
        currentState,
        nextSpeakerId,
        sceneConfig,
        sceneConfig.config.characters_config[nextSpeakerId]?.llm_config?.provider,
      );

      // 6. Generate message
      const newMessage = await this.messageGenerationService.generateMessage(
        currentState,
        sceneConfig,
        nextSpeakerId,
        recipientId,
        conversationHistory,
      );

      if (!newMessage) {
        this.logger.error(`Failed to generate or save message for ${nextSpeakerId}`);
      }

      // 7. Handle end conversation requests
      await this.conversationStateService.handleEndConversationRequests(currentState);
    } catch (error) {
      // Log the actual error object for better debugging
      this.logger.error({ err: error }, 'Error caught in conversation step');
      throw error; // Re-throw the error to propagate it
    }
  }
}
