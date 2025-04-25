import { Module } from '@nestjs/common';
import { CoreModule } from '../../core/core.module'; // Depends on EventBus
import { MemoryModule } from '../memory/memory.module'; // Depends on Memory
import { CuriosityService } from './curiosity.service';
// Import PlannerModule if CuriosityService needs to trigger planning for experiments
// import { PlannerModule } from '../planner/planner.module';

@Module({
  imports: [
    MemoryModule,
    CoreModule,
    // PlannerModule, // Uncomment if PlannerService is injected
  ],
  providers: [
    CuriosityService,
    // TODO: Define and provide an ICuriosityInterface if needed
  ],
  exports: [CuriosityService], // Export the concrete service for now
})
export class CuriosityModule {}
