import z from 'zod';
import { CharacterStateSchema } from './character';
import { MessageSchema } from './conversation';

export const SceneStateSnapshotStateSchema = z.object({
  scene_id: z.number(),
  scene_config_id: z.number(), // TODO v2: rename to `config_id`
  characters: z.record(z.string(), CharacterStateSchema),
  messages: z.array(MessageSchema),
  started_at: z.number(),
  conversation_active: z.boolean(),
  conversation_ended: z.boolean(),
  ended_at: z.number().optional().nullable(),
  visitor_count: z.number().int(),
});
export type SceneStateSnapshotState = z.infer<typeof SceneStateSnapshotStateSchema>;

export const SceneStateSnapshotSchema = z.object({
  id: z.number(),
  timestamp: z.date().describe('ISO format datetime when the snapshot was created'),
  state: SceneStateSnapshotStateSchema,
  configId: z.number(),
  sceneId: z.number(),
});
export type SceneStateSnapshot = z.infer<typeof SceneStateSnapshotSchema>;
export type NewSceneStateSnapshot = Omit<SceneStateSnapshot, 'id' | 'timestamp'>;
