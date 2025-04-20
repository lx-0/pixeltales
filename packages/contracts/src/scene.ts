import { CharacterConfigSchema } from '@pixeltales/database';
import z from 'zod';

export const CreateSceneConfigDTOSchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().min(10).max(5000),
  startCharacterId: z.string(),
  charactersConfig: z.record(z.string(), CharacterConfigSchema),
  proposerName: z.string().min(2).max(50).optional(),
});
export type CreateSceneConfigDTO = z.infer<typeof CreateSceneConfigDTOSchema>;

export const VotePayloadSchema = z.object({ vote: z.union([z.literal(1), z.literal(-1)]) });
export type VotePayload = z.infer<typeof VotePayloadSchema>;
