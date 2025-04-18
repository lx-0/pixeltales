import { Module } from '@nestjs/common';
import { LlmModule } from '../../llm/llm.module';
import { SceneStateModule } from '../../scene/scene-state/scene-state.module';
import { MessageGenerationService } from './message-generation.service';
import { ConversationDbModule } from '../conversation-db/conversation-db.module';

@Module({
  imports: [ConversationDbModule, SceneStateModule, LlmModule],
  providers: [MessageGenerationService],
  exports: [MessageGenerationService],
})
export class MessageGenerationModule {}
