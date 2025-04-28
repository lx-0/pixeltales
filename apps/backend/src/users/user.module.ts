import { Module } from '@nestjs/common';
import { UsersDbModule } from '@yesterday-ai/user-database';
import { DbModule } from 'src/db/db.module';
import { UserService } from './user.service';

@Module({
  imports: [DbModule, UsersDbModule],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
