import { Module, forwardRef } from '@nestjs/common';
import { EventsGateway } from './events.gateway';

// TODO: Decouple from V1
import { SceneManagerModule } from '../v1/scene/scene-manager/scene-manager.module';
import { SceneStateModule } from '../v1/scene/scene-state/scene-state.module';

@Module({
  imports: [forwardRef(() => SceneManagerModule), SceneStateModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
