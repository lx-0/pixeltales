import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { UsersDbService } from './users-db.service';

@Injectable()
export class UserService {
  constructor(
    private readonly usersDb: UsersDbService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(UserService.name);
  }
}
