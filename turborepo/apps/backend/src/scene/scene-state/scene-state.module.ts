import { Module } from '@nestjs/common';
import { DbModule } from 'src/db/db.module';
import { SceneStateService } from './scene-state.service';

@Module({
  imports: [DbModule],
  providers: [SceneStateService],
  exports: [SceneStateService],
})
export class SceneStateModule {}
