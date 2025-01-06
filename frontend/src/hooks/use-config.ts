import { useQuery } from '@tanstack/react-query';

interface LLMModel {
  id: string;
  name: string;
  max_tokens: number;
  default_temperature: number;
  description?: string;
}

interface LLMProvider {
  id: string;
  name: string;
  models: LLMModel[];
}

interface ColorOption {
  id: string;
  name: string;
  hex: string;
  group: string;
}

interface ConfigOptions {
  llm_providers: LLMProvider[];
  colors: ColorOption[];
}

export function useConfig() {
  return useQuery<ConfigOptions>({
    queryKey: ['config'],
    queryFn: async () => {
      const response = await fetch('/api/v1/config');
      if (!response.ok) {
        throw new Error('Failed to fetch config');
      }
      return response.json();
    },
    staleTime: Infinity, // Cache forever as this rarely changes
  });
}

// Helper to get model options for select
export function getModelOptions(providers: LLMProvider[]) {
  return providers.map((provider) => ({
    label: provider.name,
    options: provider.models.map((model) => ({
      label: model.name,
      label_details: model.description,
      value: `${provider.id}:${model.id}`,
      provider: provider.id,
      model: model.id,
      maxTokens: model.max_tokens,
      defaultTemperature: model.default_temperature,
    })),
  }));
}
