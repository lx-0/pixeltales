import { Controller, Get } from '@nestjs/common';
import { Public } from '@yesterday-ai/auth-backend';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @Public()
  getHealth() {
    return this.appService.getHealth();
  }
}
