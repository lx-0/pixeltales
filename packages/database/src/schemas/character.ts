import z from 'zod';
import { LLMConfigSchema } from './llm';

export const DirectionEnum = ['front', 'right', 'left', 'back'] as const;
export type Direction = (typeof DirectionEnum)[number];

export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});
export type Position = z.infer<typeof PositionSchema>;

export const CharacterActionEnum = [
  'thinking',
  'thinking:love',
  'thinking:anger',
  'thinking:sadness',
  'thinking:surprise',
  'thinking:fear',
  'speaking',
  'idle',
] as const;
export type CharacterAction = (typeof CharacterActionEnum)[number];

export const CharacterBaseSchema = z.object({
  id: z.string().min(1).max(50).describe('Unique identifier for the character'),
  name: z.string().min(2).max(50).describe("Character's display name (2-50 characters)"),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .describe("Character's color in hex format (e.g., #FF0000)"),
  role: z
    .string()
    .min(10)
    .max(5000)
    .describe("Character's role and personality description (10-5000 characters)"),
  visual: z
    .string()
    .min(10)
    .max(500)
    .describe("Character's visual appearance description (10-500 characters)"),
  llm_config: LLMConfigSchema.describe('LLM configuration for the character'),
});
export type CharacterBase = z.infer<typeof CharacterBaseSchema>;

export const CharacterConfigSchema = CharacterBaseSchema.extend({
  initial_position: PositionSchema.describe('Initial position of the character'),
  initial_direction: z.enum(DirectionEnum).describe('Initial direction of the character'),
  initial_action: z.enum(CharacterActionEnum).describe('Initial action of the character'),
  initial_mood: z.string().describe('Initial mood of the character'),
});
export type CharacterConfig = z.infer<typeof CharacterConfigSchema>;

export const CharacterStateSchema = CharacterBaseSchema.extend({
  position: PositionSchema,
  direction: z.enum(DirectionEnum),
  current_mood: z.string(),
  action: z.enum(CharacterActionEnum),
  action_started_at: z.number(),
  action_estimated_duration: z.number().optional().nullable(),
  end_conversation_requested: z.boolean().default(false),
  end_conversation_requested_at: z.number().optional().nullable(),
  end_conversation_requested_validity_duration: z.number().optional().nullable(),
});
export type CharacterState = z.infer<typeof CharacterStateSchema>;
