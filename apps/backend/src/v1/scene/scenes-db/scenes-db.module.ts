import { Module } from '@nestjs/common';
import { DbModule } from '../../../db/db.module';
import { ScenesDbService } from './scenes-db.service';

@Module({
  imports: [DbModule],
  providers: [ScenesDbService],
  exports: [ScenesDbService],
})
export class ScenesDbModule {}
