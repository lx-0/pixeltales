import { Module, forwardRef } from '@nestjs/common';
import { EventsV1Gateway } from './events.gateway';

// TODO: Decouple from V1
import { SceneManagerModule } from '../scene/scene-manager/scene-manager.module';
import { SceneStateModule } from '../scene/scene-state/scene-state.module';

@Module({
  imports: [forwardRef(() => SceneManagerModule), SceneStateModule],
  providers: [EventsV1Gateway],
  exports: [EventsV1Gateway],
})
export class EventsV1Module {}
