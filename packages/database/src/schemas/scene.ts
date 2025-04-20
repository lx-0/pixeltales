import { z } from 'zod';
import { uuid } from '../db-schema';

export const SceneSchema = z.object({
  id: z
    .string()
    .default(() => uuid())
    .describe('Unique identifier for the scene'),
  createdAt: z.date().describe('ISO format datetime when the scene was created'),
  configId: z.string().describe('Unique identifier for the scene configuration'),
});

export type Scene = z.infer<typeof SceneSchema>;
export type NewScene = Omit<Scene, 'id' | 'createdAt'>;
