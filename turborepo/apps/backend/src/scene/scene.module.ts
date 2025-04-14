import { Module } from '@nestjs/common';
import { DbModule } from 'src/db/db.module';
import { LlmModule } from 'src/llm/llm.module';
import { ScenesModule } from 'src/scenes/scenes.module';
import { SceneManagerService } from './scene-manager/scene-manager.service';

@Module({
  imports: [DbModule, LlmModule, ScenesModule],
  providers: [SceneManagerService],
  exports: [SceneManagerService],
})
export class SceneModule {}
