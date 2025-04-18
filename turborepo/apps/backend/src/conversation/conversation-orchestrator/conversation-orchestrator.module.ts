import { Module } from '@nestjs/common';
import { LlmModule } from '../../llm/llm.module';
import { ConversationHistoryModule } from '../conversation-history/conversation-history.module';
import { ConversationStateModule } from '../conversation-state/conversation-state.module';
import { MessageGenerationModule } from '../message-generation/message-generation.module';
import { ConversationOrchestratorService } from './conversation-orchestrator.service';

@Module({
  imports: [MessageGenerationModule, ConversationHistoryModule, ConversationStateModule, LlmModule],
  providers: [ConversationOrchestratorService],
  exports: [ConversationOrchestratorService],
})
export class ConversationOrchestratorModule {}
