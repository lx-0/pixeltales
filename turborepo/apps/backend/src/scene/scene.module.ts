import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { LlmModule } from '../llm/llm.module';
import { ScenesModule } from '../scenes/scenes.module';
import { ConversationOrchestratorService } from './conversation-orchestrator/conversation-orchestrator.service';
import { SceneManagerService } from './scene-manager/scene-manager.service';
import { SceneStateService } from './scene-state/scene-state.service';

@Module({
  imports: [DbModule, LlmModule, ScenesModule],
  providers: [SceneManagerService, SceneStateService, ConversationOrchestratorService],
  exports: [SceneManagerService],
})
export class SceneModule {}
