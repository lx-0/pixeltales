import { Module } from '@nestjs/common';
import { UsersDbModule } from '@yesterday-ai/user-database';
import { DbModule } from '../db/db.module';
import { MeController } from './me.controller';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [DbModule, UsersDbModule],
  controllers: [UsersController, MeController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
