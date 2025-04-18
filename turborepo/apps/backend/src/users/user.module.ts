import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UsersDbModule } from './users-db.module';

@Module({
  imports: [UsersDbModule],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
