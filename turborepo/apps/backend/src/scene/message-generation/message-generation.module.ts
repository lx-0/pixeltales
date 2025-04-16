import { Module } from '@nestjs/common';
import { DbModule } from 'src/db/db.module';
import { LlmModule } from '../../llm/llm.module';
import { SceneStateModule } from '../scene-state/scene-state.module';
import { MessageGenerationService } from './message-generation.service';

@Module({
  imports: [DbModule, SceneStateModule, LlmModule],
  providers: [MessageGenerationService],
  exports: [MessageGenerationService],
})
export class MessageGenerationModule {}
