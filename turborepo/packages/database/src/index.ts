import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import * as schema from './db-schema';

// === Schema Export ===
export * from './db-schema';
export * from './schemas';

// === Zod Schema Exports ===

// -- Scene Config Schemas --
export const selectSceneConfigSchema = createSelectSchema(schema.sceneConfigsTable, {
  createdAt: z.number(),
});
export const insertSceneConfigSchema = createInsertSchema(schema.sceneConfigsTable, {
  id: z.string().uuid(),
  createdAt: z.number().optional(),
});

// -- Scene Schemas --
export const selectSceneSchema = createSelectSchema(schema.scenesTable, {
  createdAt: z.number(),
  // startedAt: z.number(),
  // endedAt: z.number().nullable(),
  // isActive: z.boolean(),
});
export const insertSceneSchema = createInsertSchema(schema.scenesTable, {
  id: z.string().uuid(),
  createdAt: z.number().optional(),
  // startedAt: z.number(),
  // endedAt: z.number().optional().nullable(),
  // isActive: z.boolean().optional(),
});

// -- Scene State Snapshot Schemas --
export const selectSceneStateSnapshotSchema = createSelectSchema(schema.sceneStateSnapshotsTable, {
  timestamp: z.number(),
});
export const insertSceneStateSnapshotSchema = createInsertSchema(schema.sceneStateSnapshotsTable, {
  id: z.string().uuid(),
  timestamp: z.number().optional(),
});

// -- Character Schemas --
export const selectCharacterSchema = createSelectSchema(schema.charactersTable);
export const insertCharacterSchema = createInsertSchema(schema.charactersTable, {
  id: z.string(),
  color: z.string().optional().nullable(),
});

// -- Message Schemas --
export const selectMessageSchema = createSelectSchema(schema.messagesTable, {
  timestamp: z.number(),
  calculatedSpeakingTime: z.number().nullable(),
  conversationRating: z.number().int().nullable(),
  endConversation: z.boolean().nullable(),
  tokenCount: z.number().int().nullable(),
  cost: z.number().nullable(),
});
export const insertMessageSchema = createInsertSchema(schema.messagesTable, {
  id: z.string().uuid(),
  timestamp: z.number().optional(),
  sceneId: z.string(),
  characterId: z.string(),
  calculatedSpeakingTime: z.number().optional().nullable(),
  conversationRating: z.number().int().optional().nullable(),
  endConversation: z.boolean().optional(),
  tokenCount: z.number().int().optional().nullable(),
  cost: z.number().optional().nullable(),
});
