import { LlmProvider } from '../../contracts/src/llm';

export const LLM_PROVIDERS: LlmProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    models: [
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o mini',
        maxTokens: 128000,
        defaultTemperature: 0.7,
        description: 'Fastest, most affordable yet highly intelligent model.',
      },
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        maxTokens: 128000,
        defaultTemperature: 0.7,
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
        maxTokens: 200000,
        defaultTemperature: 0.7,
        description: 'Most intelligent model, excels at complex tasks.',
      },
      {
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        maxTokens: 200000,
        defaultTemperature: 0.7,
        description: 'Fastest and most compact model for near-instant responsiveness.',
      },
    ],
  },
];
