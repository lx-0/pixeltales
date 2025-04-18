import { Module } from '@nestjs/common';
import { ScenesController } from './scenes.controller';
import { ScenesService } from './scenes.service';
import { ScenesDbModule } from 'src/scene/scenes-db/scenes-db.module';

@Module({
  imports: [ScenesDbModule],
  controllers: [ScenesController],
  providers: [ScenesService],
  exports: [ScenesService],
})
export class ScenesModule {}
