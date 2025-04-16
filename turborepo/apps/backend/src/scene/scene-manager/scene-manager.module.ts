import { Module } from '@nestjs/common';
import { ScenesModule } from 'src/scenes/scenes.module';
import { DbModule } from '../../db/db.module';
import { LlmModule } from '../../llm/llm.module';
import { ConversationOrchestratorModule } from '../conversation-orchestrator/conversation-orchestrator.module';
import { SceneStateModule } from '../scene-state/scene-state.module';
import { SceneManagerService } from './scene-manager.service';
import { CharactersModule } from 'src/characters/characters.module';

@Module({
  imports: [
    DbModule,
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
