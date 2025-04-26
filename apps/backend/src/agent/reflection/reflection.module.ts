// This file is intentionally left blank. It serves as a placeholder for the reflection module.

import { Module } from '@nestjs/common';
import { CoreModule } from '../../core/core.module';
import { AgentLlmModule } from '../llm/agent-llm.module';
import { MemoryModule } from '../memory/memory.module';
import { OntologyModule } from '../ontology/ontology.module';
import { SelfModelingModule } from '../self-modeling/self-modeling.module';
import { REFLECTION_SERVICE } from './reflection.interface';
import { ReflectionService } from './reflection.service';

@Module({
  imports: [
    CoreModule, // For EventBus
    MemoryModule, // Provides MEMORY_INTERFACE
    SelfModelingModule, // Provides SELF_MODELING_SERVICE
    OntologyModule, // Provides ONTOLOGY_SERVICE
    AgentLlmModule, // Provides AGENT_LLM_SERVICE
  ],
  providers: [
    {
      provide: REFLECTION_SERVICE,
      useClass: ReflectionService,
    },
  ],
  exports: [REFLECTION_SERVICE],
})
export class ReflectionModule {}
