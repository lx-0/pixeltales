import { Module } from '@nestjs/common';
import { CoreModule } from '../../core/core.module'; // Assuming EventBus is here
import { ActionModule } from '../action/action.module';
import { MemoryModule } from '../memory/memory.module';
import { PlannerModule } from '../planner/planner.module';
import { CognitiveCycleService } from './cognitive-cycle.service';
// Import other dependencies like Perception, LLM services/modules when available

@Module({
  imports: [
    CoreModule, // For EventBus
    MemoryModule, // For IMemoryInterface
    PlannerModule, // For IPlannerService
    ActionModule, // For IActionService
    // PerceptionModule,
    // ActionModule,
    // LlmModule,
    // CuriosityModule,
    // SelfModelingModule,
    // TODO: Import other dependencies like LlmModule, AgentStateModule?
  ],
  providers: [CognitiveCycleService],
  exports: [CognitiveCycleService], // Export if needed by AgentService/Factory
})
export class CognitiveCycleModule {}
