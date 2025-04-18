import { z } from 'zod';

export const SceneSchema = z.object({
  id: z.number().describe('Unique identifier for the scene'),
  createdAt: z.date().describe('ISO format datetime when the scene was created'),
  sceneConfigId: z.number().describe('Unique identifier for the scene configuration'),
});

export type Scene = z.infer<typeof SceneSchema>;
export type NewScene = Omit<Scene, 'id' | 'createdAt'>;
