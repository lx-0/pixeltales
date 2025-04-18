import { Module } from '@nestjs/common';
import { MeController } from './me.controller';
import { UsersDbModule } from './users-db.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [UsersDbModule],
  controllers: [UsersController, MeController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
