import { Module } from '@nestjs/common';
import { SceneManagerModule } from 'src/scene/scene-manager/scene-manager.module';
import { EventsGateway } from './events.gateway';

@Module({
  imports: [SceneManagerModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
