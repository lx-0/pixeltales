import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { CostTrackerService } from './cost-tracker.service';
import { LlmService } from './llm.service';
import { TokenCounter } from './token-counter';

@Module({
  providers: [
    LlmService,
    {
      provide: CostTrackerService,
      useFactory: (logger: PinoLogger, configService: ConfigService) =>
        new CostTrackerService(logger, configService),
      inject: [PinoLogger, ConfigService],
    },
    {
      provide: TokenCounter,
      useFactory: (logger: PinoLogger, configService: ConfigService) =>
        new TokenCounter(logger, configService),
      inject: [PinoLogger, ConfigService],
    },
  ],
  exports: [LlmService, TokenCounter, CostTrackerService],
})
export class LlmModule {}
