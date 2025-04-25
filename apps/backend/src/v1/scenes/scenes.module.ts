import { Module } from '@nestjs/common';
import { ScenesDbModule } from '../scene/scenes-db/scenes-db.module';
import { ScenesController } from './scenes.controller';
import { ScenesService } from './scenes.service';

@Module({
  imports: [ScenesDbModule],
  controllers: [ScenesController],
  providers: [ScenesService],
  exports: [ScenesService],
})
export class ScenesModule {}
