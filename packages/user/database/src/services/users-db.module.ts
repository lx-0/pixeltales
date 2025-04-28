import { Module } from '@nestjs/common';
import { UsersDbService } from './users-db.service';

@Module({
  providers: [UsersDbService],
  exports: [UsersDbService],
})
export class UsersDbModule {}
