import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import * as schema from './db-schema';

// === Schema Export ===
export * from './client';
export * from './db-schema';
export * from './schemas';

// === TypeScript Type Exports ===
export type DBSceneConfig = typeof schema.sceneConfigsTable.$inferSelect;
export type NewDBSceneConfig = typeof schema.sceneConfigsTable.$inferInsert;
export type DBScene = typeof schema.scenesTable.$inferSelect;
export type NewDBScene = typeof schema.scenesTable.$inferInsert;
export type DBSceneStateSnapshot = typeof schema.sceneStateSnapshotsTable.$inferSelect;
export type NewDBSceneStateSnapshot = typeof schema.sceneStateSnapshotsTable.$inferInsert;
export type DBCharacter = typeof schema.charactersTable.$inferSelect;
export type NewDBCharacter = typeof schema.charactersTable.$inferInsert;
export type DBMessage = typeof schema.messagesTable.$inferSelect;
export type NewDBMessage = typeof schema.messagesTable.$inferInsert;

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
