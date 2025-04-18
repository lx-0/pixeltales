import { Module, forwardRef } from '@nestjs/common';
import { SceneManagerModule } from '../scene/scene-manager/scene-manager.module';
import { SceneStateModule } from '../scene/scene-state/scene-state.module';
import { EventsGateway } from './events.gateway';

@Module({
  imports: [forwardRef(() => SceneManagerModule), SceneStateModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
