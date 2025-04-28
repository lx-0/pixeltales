import { Injectable } from '@nestjs/common';
import { UsersDbService } from '@yesterday-ai/user-database';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class UserService {
  constructor(
    private readonly usersDb: UsersDbService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(UserService.name);
  }
}
