import { Module } from '@nestjs/common';
import { CoreModule } from '../../core/core.module';
import { ActionModule } from '../action/action.module';
import { InternalToolsModule } from '../internal-tools/internal-tools.module';
import { LearningModule } from '../learning/learning.module';
import { AgentLlmModule } from '../llm/agent-llm.module';
import { MemoryModule } from '../memory/memory.module';
import { PlannerModule } from '../planner/planner.module';
import { ReflectionModule } from '../reflection/reflection.module';
import { CognitiveCycleService } from './cognitive-cycle.service';
// Import other dependencies like Perception, LLM services/modules when available

@Module({
  imports: [
    CoreModule, // For EventBus
    MemoryModule, // For IMemoryInterface
    PlannerModule, // For IPlannerService
    ActionModule, // For IActionService
    InternalToolsModule, // For IInternalToolsInterface
    AgentLlmModule, // For IAgentLlmService
    LearningModule, // For IRewardFunction
    ReflectionModule, // For IReflectionService
    // PerceptionModule,
    // CuriosityModule,
    // SelfModelingModule,
    // TODO: Import other dependencies like LlmModule, AgentStateModule?
  ],
  providers: [CognitiveCycleService],
  exports: [CognitiveCycleService], // Export if needed by AgentService/Factory
})
export class CognitiveCycleModule {}
