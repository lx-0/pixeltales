import { LLMProviderSchema } from '@pixeltales/database';
import z from 'zod';

// --- Config Option Schemas (for /config API) ---

export const ColorOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  group: z.string(),
});
export type ColorOption = z.infer<typeof ColorOptionSchema>;

export const ConfigOptionsSchema = z.object({
  llm_providers: z.array(LLMProviderSchema),
  colors: z.array(ColorOptionSchema),
});
export type ConfigOptions = z.infer<typeof ConfigOptionsSchema>;
