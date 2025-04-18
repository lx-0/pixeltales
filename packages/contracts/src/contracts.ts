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

// Character response schema for LLM
export const CharacterResponseSchema = z.object({
  recipient: z.string().describe('The recipient of the message'),
  reaction_on_previous_message: z
    .string()
    .nullable()
    .describe('A single unicode emoji that best represents your reaction on the previous message'),
  conversation_rating: z
    .number()
    .int()
    .min(1)
    .max(10)
    .nullable()
    .describe(
      'How would you rate the conversation until now, from 1 to 10? You can use this to emphasize your feelings about the conversation.',
    ),
  mood: z.string().describe('A descriptive word or short phrase for your current emotional state'),
  mood_emoji: z.string().describe('A single unicode emoji that best represents your mood'),
  thoughts: z.string().describe('Your thoughts about the conversation'),
  content: z.string().nullable().describe('Your spoken response'),
  end_conversation: z.boolean().describe('Whether your response ends the conversation'),
});
export type CharacterResponse = z.infer<typeof CharacterResponseSchema>;
