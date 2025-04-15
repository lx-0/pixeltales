import z from 'zod';
import { CharacterStateSchema } from './character';
import { MessageSchema } from './conversation';

export const SceneStateSchema = z.object({
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
export type SceneState = z.infer<typeof SceneStateSchema>;
