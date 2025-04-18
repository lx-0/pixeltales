import z from 'zod';

export const LLMModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  max_tokens: z.number().int(),
  default_temperature: z.number().min(0).max(2).default(0.7),
  description: z.string().optional().nullable(),
});
export type LLMModel = z.infer<typeof LLMModelSchema>;

export const LLMProviderEnum = ['openai', 'anthropic'] as const;
export type LLMProviderId = (typeof LLMProviderEnum)[number];

export const LLMProviderSchema = z.object({
  id: z.enum(LLMProviderEnum),
  name: z.string(),
  models: z.array(LLMModelSchema),
});
export type LLMProvider = z.infer<typeof LLMProviderSchema>;

// -- LLM Config used by Characters --
export const LLMConfigSchema = z.object({
  provider: z.enum(LLMProviderEnum),
  model_name: z.string().min(1).max(50),
  max_tokens: z.number().int().gt(0).lte(32000),
  temperature: z.number().min(0).max(2),
});
export type LLMConfig = z.infer<typeof LLMConfigSchema>;
