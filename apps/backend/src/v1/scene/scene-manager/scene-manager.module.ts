import { Module } from '@nestjs/common';
import { CharactersModule } from '../../characters/characters.module';
import { ConversationOrchestratorModule } from '../../conversation/conversation-orchestrator/conversation-orchestrator.module';
import { LlmModule } from '../../llm/llm.module';
import { ScenesModule } from '../../scenes/scenes.module';
import { SceneStateModule } from '../scene-state/scene-state.module';
import { ScenesDbModule } from '../scenes-db/scenes-db.module';
import { SceneManagerService } from './scene-manager.service';

@Module({
  imports: [
    ScenesDbModule,
    LlmModule,
    ScenesModule,
    SceneStateModule,
    CharactersModule,
    ConversationOrchestratorModule,
  ],
  providers: [SceneManagerService],
  exports: [SceneManagerService],
})
export class SceneManagerModule {}
