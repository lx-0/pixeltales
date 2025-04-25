import { Module } from '@nestjs/common';
import { LlmModule } from '../../../llm/llm.module';
import { ConversationHistoryService } from './conversation-history.service';

@Module({
  imports: [LlmModule],
  providers: [ConversationHistoryService],
  exports: [ConversationHistoryService],
})
export class ConversationHistoryModule {}
