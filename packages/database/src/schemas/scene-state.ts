import z from 'zod';
import { uuid } from '../db-schema';
import { CharacterStateSchema } from './character';
import { MessageSchema } from './conversation';

export const SceneStateSnapshotCustomSchema = z
  .object({})
  .describe('Custom fields for the scene state snapshot');
export type SceneStateSnapshotCustom = z.infer<typeof SceneStateSnapshotCustomSchema>;

export const SceneStateSnapshotSchema = z.object({
  id: z
    .string()
    .default(() => uuid())
    .describe('Unique identifier for the scene state snapshot'),
  timestamp: z.coerce.date().default(new Date()).describe('Datetime when the snapshot was created'),
  sceneId: z.string().describe('Unique identifier for the scene'),
  configId: z.string().describe('Unique identifier for the scene configuration'),
  characters: z.record(z.string(), CharacterStateSchema).describe('Characters in the scene'),
  messages: z.array(MessageSchema).default([]).describe('Messages in the scene'),
  startedAt: z.coerce.date().describe('Datetime when the scene was started'),
  conversationActive: z.boolean().describe('Whether the conversation is active'),
  conversationEnded: z.boolean().default(false).describe('Whether the conversation is ended'),
  endedAt: z.coerce.date().optional().nullable().describe('Datetime when the scene was ended'),
  custom: SceneStateSnapshotCustomSchema.default({}),
});
export type SceneStateSnapshot = z.infer<typeof SceneStateSnapshotSchema>;
export type NewSceneStateSnapshot = Omit<z.input<typeof SceneStateSnapshotSchema>, 'id'>;
export type UpdateSceneStateSnapshot = Partial<Omit<SceneStateSnapshot, 'id'>>;
