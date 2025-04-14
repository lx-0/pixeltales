import { Injectable } from '@nestjs/common';
import {
  ConfigOptions,
  ColorOption as ContractsColorOptionType,
  LLMProvider as ContractsLLMProviderType,
} from '@pixeltales/contracts';

// TODO: Move these constants to a proper config file or module
const LLM_PROVIDERS: ContractsLLMProviderType[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    models: [
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o mini',
        max_tokens: 128000,
        default_temperature: 0.7,
        description: 'Fastest, most affordable yet highly intelligent model.',
      },
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        max_tokens: 128000,
        default_temperature: 0.7,
        description: 'Our most advanced model, multimodal.',
      },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    models: [
      {
        id: 'claude-3-5-sonnet-20240620',
        name: 'Claude 3.5 Sonnet',
        max_tokens: 200000,
        default_temperature: 0.7,
        description: 'Most intelligent model, excels at complex tasks.',
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        max_tokens: 200000,
        default_temperature: 0.7,
        description: 'Fastest and most compact model for near-instant responsiveness.',
      },
    ],
  },
];

const CHARACTER_COLORS: ContractsColorOptionType[] = [
  { id: 'red', name: 'Red', hex: '#FF0000', group: 'accent' },
  { id: 'blue', name: 'Blue', hex: '#0000FF', group: 'accent' },
  // Add more colors...
];

@Injectable()
export class AppConfigService {
  getConfigOptions(): ConfigOptions {
    return {
      llm_providers: LLM_PROVIDERS,
      colors: CHARACTER_COLORS,
    };
  }
}
