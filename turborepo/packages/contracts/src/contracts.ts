// This package will contain shared types, interfaces, schemas, etc.

import { z } from 'zod';

// --- API Specific Schemas / DTOs ---

export const CreateSceneConfigDTOSchema = z.object({
  name: z.string().min(3).max(50),
  description: z.string().min(10).max(5000),
  start_character_id: z.string(),
  characters_config: z.record(z.string(), CharacterConfigSchema),
  proposer_name: z.string().min(2).max(50).optional(),
});
export type CreateSceneConfigDTO = z.infer<typeof CreateSceneConfigDTOSchema>;

// Define CharacterState and SceneState manually if needed,
// or rely on importing the generated Zod schemas from database via the export * above
// Example using imported schemas:
import { CharacterConfigSchema, selectSceneConfigSchema } from '@pixeltales/database';

// API Response DTO
export const SceneConfigResponseSchema = selectSceneConfigSchema;
export type SceneConfigResponse = z.infer<typeof SceneConfigResponseSchema>;

export const VotePayloadSchema = z.object({ vote: z.union([z.literal(1), z.literal(-1)]) });
export type VotePayload = z.infer<typeof VotePayloadSchema>;

export const CommentPayloadSchema = z.object({
  user: z.string().min(2).max(50),
  comment: z.string().min(1).max(1000),
});
export type CommentPayload = z.infer<typeof CommentPayloadSchema>;
