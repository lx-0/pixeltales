import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { UsersDbService } from './users-db.service';

@Module({
  imports: [DbModule],
  providers: [UsersDbService],
  exports: [UsersDbService],
})
export class UsersDbModule {}
