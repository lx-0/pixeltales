import { Module } from '@nestjs/common';
import { CostTrackerService } from './cost-tracker.service';
import { LlmService } from './llm.service';
import { TokenCounter } from './token-counter';

@Module({
  providers: [LlmService, TokenCounter, CostTrackerService],
  exports: [LlmService, TokenCounter, CostTrackerService],
})
export class LlmModule {}
