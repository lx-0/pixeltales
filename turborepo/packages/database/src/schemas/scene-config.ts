import { z } from 'zod';
import { CharacterConfigSchema } from './character';
import { CommentSchema } from './user';

export const SceneConfigStatusEnum = ['proposed', 'active', 'rejected'] as const;
export type SceneConfigStatus = (typeof SceneConfigStatusEnum)[number];

// Define SceneConfig separately, as it might differ from DB record slightly
export const SceneConfigConfigSchema = z.object({
  id: z.number().describe('Unique identifier for the scene configuration'),
  name: z.string().min(3).max(50).describe('Scene name (3-50 characters)'),
  description: z.string().min(10).max(5000).describe('Scene description (10-5000 characters)'),
  start_character_id: z.string().describe('ID of the character who starts the conversation'),
  characters_config: z
    .record(z.string(), CharacterConfigSchema)
    .describe('Configuration for each character in the scene, keyed by character ID'),
  status: z
    .enum(SceneConfigStatusEnum)
    .describe('Current status of the scene configuration (proposed, active, or rejected)'),
  proposer_name: z
    .string()
    .min(2)
    .max(50)
    .optional()
    .nullable()
    .describe('Name of the person proposing the scene (2-50 characters)'),
  proposed_at: z
    .string()
    .datetime()
    .optional()
    .nullable()
    .describe('ISO format datetime when the scene was proposed'),
  votes: z
    .number()
    .int()
    .optional()
    .default(0)
    .describe('Number of votes the scene proposal has received'),
  comments: z
    .array(CommentSchema)
    .optional()
    .default([])
    .describe('Comments on the scene proposal'),
  system_prompt: z.string().min(0).max(5000).describe('System prompt for the scene'),
});
export type SceneConfigConfig = z.infer<typeof SceneConfigConfigSchema>;

export const SceneConfigSchema = z.object({
  id: z.number().describe('Unique identifier for the scene configuration'),
  createdAt: z
    .date()
    .default(new Date())
    .describe('ISO format datetime when the scene was created'),
  config: SceneConfigConfigSchema,
  votes: z.number().default(0).describe('Number of votes the scene proposal has received'),
  status: z
    .enum(SceneConfigStatusEnum)
    .default('proposed')
    .describe('Current status of the scene configuration'),
  systemPrompt: z.string().default('').describe('System prompt for the scene'),
});
export type SceneConfig = z.infer<typeof SceneConfigSchema>;
export type NewSceneConfig = Omit<
  SceneConfig,
  'id' | 'createdAt' | 'status' | 'votes' | 'systemPrompt'
> &
  Partial<Pick<SceneConfig, 'status' | 'votes' | 'systemPrompt'>>;
export type UpdateSceneConfig = Partial<Omit<SceneConfig, 'id'>>;
