import { Module } from '@nestjs/common';
import { ScenesDbModule } from '../scenes-db/scenes-db.module';
import { SceneStateService } from './scene-state.service';

@Module({
  imports: [ScenesDbModule],
  providers: [SceneStateService],
  exports: [SceneStateService],
})
export class SceneStateModule {}
