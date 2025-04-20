import { configApi } from '@/lib/api/config-api';
import { ConfigOptions, LlmProvider } from '@pixeltales/contracts';
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
export function getModelOptions(providers: LlmProvider[]) {
  return providers.map((provider) => ({
    label: provider.name,
    options: provider.models.map((model) => ({
      label: model.name,
      labelDetails: model.description,
      value: `${provider.id}:${model.id}`,
      provider: provider.id,
      model: model.id,
      maxTokens: model.maxTokens,
      defaultTemperature: model.defaultTemperature,
    })),
  }));
}
