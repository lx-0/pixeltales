import { Module } from '@nestjs/common';
import { SceneStateModule } from '../scene-state/scene-state.module';
import { ConversationStateService } from './conversation-state.service';

@Module({
  imports: [SceneStateModule],
  providers: [ConversationStateService],
  exports: [ConversationStateService],
})
export class ConversationStateModule {}
