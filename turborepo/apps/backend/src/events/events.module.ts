import { Module } from '@nestjs/common';
import { SceneModule } from '../scene/scene.module';
import { EventsGateway } from './events.gateway';

@Module({
  imports: [SceneModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
