import { Module } from '@nestjs/common';
import { AgentLlmModule } from '../llm/agent-llm.module';
import { HtnPlannerService } from './htn-planner.service';
import { PLANNER_SERVICE } from './planner.interface';

@Module({
  imports: [AgentLlmModule],
  providers: [
    HtnPlannerService, // Concrete implementation
    // Provide the interface
    {
      provide: PLANNER_SERVICE,
      useExisting: HtnPlannerService, // Use the existing concrete service instance
    },
  ],
  exports: [PLANNER_SERVICE], // Export the interface token
})
export class PlannerModule {}
