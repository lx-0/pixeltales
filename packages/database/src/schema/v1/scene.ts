import { z } from 'zod';
import { uuid } from '../../uuid';

export const SceneSchema = z.object({
  id: z
    .string()
    .default(() => uuid())
    .describe('Unique identifier for the scene'),
  createdAt: z.coerce.date().describe('Datetime when the scene was created'),
  configId: z.string().describe('Unique identifier for the scene configuration'),
});

export type Scene = z.infer<typeof SceneSchema>;
export type NewScene = Omit<Scene, 'id' | 'createdAt'>;
