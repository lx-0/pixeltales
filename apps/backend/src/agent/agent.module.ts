import { Module } from '@nestjs/common';
import { SimulationModule } from '../simulation/simulation.module';
import { ActionModule } from './action/action.module';
import { AgentFactory } from './agent.factory';
import { AgentService } from './agent.service';
import { CognitiveCycleModule } from './cognitive-cycle/cognitive-cycle.module';
import { CuriosityModule } from './curiosity/curiosity.module';
import { ExtensionsModule } from './extensions/extensions.module';
import { InternalToolsModule } from './internal-tools/internal-tools.module';
import { LearningModule } from './learning/learning.module';
import { MemoryModule } from './memory/memory.module';
import { OntologyModule } from './ontology/ontology.module';
import { PlannerModule } from './planner/planner.module';
import { SelfModelingModule } from './self-modeling/self-modeling.module';
import { ReflectionModule } from './reflection/reflection.module';

@Module({
  imports: [
    // Import all agent subsystem modules
    MemoryModule,
    PlannerModule,
    LearningModule,
    OntologyModule,
    CuriosityModule,
    SelfModelingModule,
    ExtensionsModule,
    InternalToolsModule,
    CognitiveCycleModule,
    ActionModule,
    SimulationModule,
    ReflectionModule,
    // CoreModule might be imported here if AgentService/Factory need core services directly,
    // but often CoreModule is imported at the AppModule level.
  ],
  providers: [AgentService, AgentFactory],
  exports: [
    AgentService, // Export AgentService for other parts of the application (e.g., SceneManager)
    AgentFactory, // Export Factory if needed elsewhere
  ],
})
export class AgentModule {}
