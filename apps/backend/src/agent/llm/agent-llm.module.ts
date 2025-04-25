import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // LLM Service needs ConfigService
import { AGENT_LLM_SERVICE } from './agent-llm.interface';
import { AgentLlmService } from './agent-llm.service';

@Module({
  imports: [ConfigModule], // Import ConfigModule to make ConfigService available
  providers: [
    {
      provide: AGENT_LLM_SERVICE,
      useClass: AgentLlmService,
    },
    // AgentLlmService implicitly provided by useClass
  ],
  exports: [AGENT_LLM_SERVICE], // Export token for injection
})
export class AgentLlmModule {}
