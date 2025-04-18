import { Controller, Get } from '@nestjs/common';
import { ConfigOptions } from '@pixeltales/contracts';
import { Public } from '../auth/decorators/public.decorator';
import { AppConfigService } from './app-config.service';

@Controller('config')
@Public()
export class AppConfigController {
  constructor(private readonly appConfigService: AppConfigService) {}

  @Get()
  getConfigOptions(): ConfigOptions {
    return this.appConfigService.getConfigOptions();
  }
}
