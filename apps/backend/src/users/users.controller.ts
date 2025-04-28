import { Controller, Get, HttpException, HttpStatus, Param } from '@nestjs/common';
import { User } from '@yesterday-ai/user-contracts';
import { PinoLogger } from 'nestjs-pino';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(UsersController.name);
  }

  @Get(':id')
  async getUserById(@Param('id') id: string): Promise<User> {
    this.logger.info(`Getting user by ID: ${id}`);
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return user;
  }
}
