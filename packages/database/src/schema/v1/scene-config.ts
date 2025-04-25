import { z } from 'zod';
import { uuid } from '../../uuid';
import { CommentSchema } from '../user';
import { CharacterConfigSchema } from './character';

export const SceneConfigStatusEnum = ['proposed', 'active', 'rejected'] as const;
export type SceneConfigStatus = (typeof SceneConfigStatusEnum)[number];

// Define SceneConfig separately, as it might differ from DB record slightly
export const SceneConfigCustomSchema = z
  .object({})
  .describe('Custom fields for the scene configuration');
export type SceneConfigCustom = z.infer<typeof SceneConfigCustomSchema>;

export const SceneConfigSchema = z.object({
  id: z
    .string()
    .default(() => uuid())
    .describe('Unique identifier for the scene configuration'),
  name: z.string().min(3).max(50).describe('Scene name (3-50 characters)'),
  description: z.string().min(10).max(5000).describe('Scene description (10-5000 characters)'),
  systemPrompt: z.string().min(0).max(5000).default('').describe('System prompt for the scene'),
  charactersConfig: z
    .record(z.string(), CharacterConfigSchema)
    .describe('Configuration for each character in the scene, keyed by character ID'),
  startCharacterId: z.string().describe('ID of the character who starts the conversation'),
  status: z
    .enum(SceneConfigStatusEnum)
    .default('proposed')
    .describe('Current status of the scene configuration (proposed, active, or rejected)'),
  proposerName: z
    .string()
    .min(2)
    .max(50)
    .optional()
    .nullable()
    .describe('Name of the person proposing the scene (2-50 characters)'),
  proposedAt: z.coerce
    .date()
    .optional()
    .nullable()
    .describe('Datetime when the scene was proposed'),
  votes: z.number().default(0).describe('Number of votes the scene proposal has received'),
  comments: z
    .array(CommentSchema)
    .optional()
    .default([])
    .describe('Comments on the scene proposal'),
  createdAt: z.coerce.date().default(new Date()).describe('Datetime when the scene was created'),
  custom: SceneConfigCustomSchema.default({}),
});
export type SceneConfig = z.output<typeof SceneConfigSchema>;
export type NewSceneConfig = Omit<z.input<typeof SceneConfigSchema>, 'id'>;
export type UpdateSceneConfig = Partial<Omit<SceneConfig, 'id'>>;
