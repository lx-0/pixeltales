import { Module } from '@nestjs/common';
import { CircuitBreakerService } from './circuit-breaker.service';

@Module({
  providers: [CircuitBreakerService],
  exports: [CircuitBreakerService], // Export if needed by other modules like AgentLlmModule
})
export class ResilienceModule {}
