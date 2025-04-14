import { Controller, Get } from '@nestjs/common';
import { ConfigOptions } from '@pixeltales/contracts';
import { AppConfigService } from './app-config.service';

@Controller('config')
export class AppConfigController {
  constructor(private readonly appConfigService: AppConfigService) {}

  @Get()
  getConfigOptions(): ConfigOptions {
    return this.appConfigService.getConfigOptions();
  }
}
