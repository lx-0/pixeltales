import { useQuery } from '@tanstack/react-query';
import { apiClient, type Schemas } from '@/api/client';

export type ConfigOptions = Schemas['ConfigOptions'];
export type LLMProvider = Schemas['LLMProvider'];

export function useConfig() {
  return useQuery({
    queryKey: ['config'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/config');
      if (error) throw new Error('Failed to fetch config');
      return data;
    },
    staleTime: Number.POSITIVE_INFINITY,
  });
}

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
