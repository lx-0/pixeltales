import { Injectable } from '@nestjs/common';
import { ConfigOptions } from '@pixeltales/contracts';
import { LLM_PROVIDERS } from '@yesterday-ai/llm-shared';

import { CHARACTER_COLORS } from '../v1/characters/character.const';

@Injectable()
export class AppConfigService {
  getConfigOptions(): ConfigOptions {
    return {
      llmProviders: LLM_PROVIDERS,
      colors: CHARACTER_COLORS,
    };
  }
}
