import { Module, forwardRef } from '@nestjs/common';
import { SceneManagerModule } from 'src/scene/scene-manager/scene-manager.module';
import { SceneStateModule } from 'src/scene/scene-state/scene-state.module';
import { EventsGateway } from './events.gateway';

@Module({
  imports: [forwardRef(() => SceneManagerModule), SceneStateModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
