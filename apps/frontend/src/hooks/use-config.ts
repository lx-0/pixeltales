import { configApi } from '@/lib/api/config-api';
import { ConfigOptions, LLMProvider } from '@pixeltales/contracts';
import { useQuery } from '@tanstack/react-query';

export function useConfig() {
  return useQuery<ConfigOptions>({
    queryKey: ['config'],
    queryFn: async () => {
      return configApi.getConfig();
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
