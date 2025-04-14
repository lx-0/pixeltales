// This package will contain shared types, interfaces, schemas, etc.

import { insertSceneConfigSchema, selectSceneConfigSchema } from '@pixeltales/database';
import { z } from 'zod';
// Import the Drizzle schema definition itself from the database package

// --- Enums / Literals ---
export const SceneConfigStatusEnum = ['proposed', 'active', 'rejected'] as const;
export type SceneConfigStatus = (typeof SceneConfigStatusEnum)[number];

export const DirectionEnum = ['front', 'right', 'left', 'back'] as const;
export type Direction = (typeof DirectionEnum)[number];

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

export const LLMProviderEnum = ['openai', 'anthropic'] as const;
export type LLMProvider = (typeof LLMProviderEnum)[number];

// --- Simple Types ---
export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});
export type Position = z.infer<typeof PositionSchema>;

// --- Database Types (Re-exported from generated types) ---
export type {
  Character as DBCharacter,
  Message as DBMessage,
  Scene as DBScene,
  SceneConfig as DBSceneConfig,
  SceneStateSnapshot as DBSceneStateSnapshot,
  NewCharacter as NewDBCharacter,
  NewMessage as NewDBMessage,
  NewScene as NewDBScene,
  NewSceneConfig as NewDBSceneConfig,
  NewSceneStateSnapshot as NewDBSceneStateSnapshot,
} from '@pixeltales/database';

// --- Zod Schemas (Re-exported from database package) ---
export {
  insertCharacterSchema,
  insertMessageSchema,
  insertSceneConfigSchema,
  insertSceneSchema,
  insertSceneStateSnapshotSchema,
  selectCharacterSchema,
  selectMessageSchema,
  selectSceneConfigSchema,
  selectSceneSchema,
  selectSceneStateSnapshotSchema,
} from '@pixeltales/database'; // Re-export Zod schemas from database

// --- API Specific Schemas / DTOs (Derived from re-exported Zod schemas) ---

// Example: Infer TS types directly from Zod schemas
export type SceneConfigResponse = z.infer<typeof selectSceneConfigSchema>;
export type CreateSceneConfigDTO = z.infer<typeof insertSceneConfigSchema>;
export type VotePayload = z.infer<typeof VotePayloadSchema>;

// Define other DTOs like VotePayloadSchema etc.
export const VotePayloadSchema = z.object({ vote: z.union([z.literal(1), z.literal(-1)]) });

// --- Other Shared Constants/Types ---
export const EXAMPLE_CONSTANT = 'Hello from Shared Contracts!';

// TODO: Define Zod schema for CharacterConfig etc. based on re-exported schemas or manually
