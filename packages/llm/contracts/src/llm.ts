import z from 'zod';

export const LlmModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  maxTokens: z.number().int(),
  defaultTemperature: z.number().min(0).max(2).default(0.7),
  description: z.string().optional().nullable(),
});
export type LlmModel = z.infer<typeof LlmModelSchema>;
export type NewLlmModel = z.input<typeof LlmModelSchema>;

export const LlmProviderEnum = ['openai', 'anthropic'] as const;
export type LlmProviderId = (typeof LlmProviderEnum)[number];

export const LlmProviderSchema = z.object({
  id: z.enum(LlmProviderEnum),
  name: z.string(),
  models: z.array(LlmModelSchema),
});
export type LlmProvider = z.infer<typeof LlmProviderSchema>;

// -- LLM Config used by Characters --
export const LlmConfigSchema = z.object({
  provider: z.enum(LlmProviderEnum),
  modelName: z.string().min(1).max(50),
  maxTokens: z.number().int().gt(0).lte(32000),
  temperature: z.number().min(0).max(2),
});
export type LlmConfig = z.infer<typeof LlmConfigSchema>;
