import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { schema } from './schema';

// === Schema Export ===
export * from './schema';

// === TypeScript Type Exports ===
export type SceneConfig = typeof schema.sceneConfigsTable.$inferSelect;
export type NewSceneConfig = typeof schema.sceneConfigsTable.$inferInsert;
export type Scene = typeof schema.scenesTable.$inferSelect;
export type NewScene = typeof schema.scenesTable.$inferInsert;
export type SceneStateSnapshot = typeof schema.sceneStateSnapshotsTable.$inferSelect;
export type NewSceneStateSnapshot = typeof schema.sceneStateSnapshotsTable.$inferInsert;
export type Character = typeof schema.charactersTable.$inferSelect;
export type NewCharacter = typeof schema.charactersTable.$inferInsert;
export type Message = typeof schema.messagesTable.$inferSelect;
export type NewMessage = typeof schema.messagesTable.$inferInsert;

// === Zod Schema Exports ===

// -- Scene Config Schemas --
export const selectSceneConfigSchema: z.ZodObject<any> = createSelectSchema(
  schema.sceneConfigsTable,
  {
    createdAt: z.date(),
  },
);
export const insertSceneConfigSchema: z.ZodObject<any> = createInsertSchema(
  schema.sceneConfigsTable,
  {
    id: z.string().uuid(),
    createdAt: z.date(),
  },
);

// -- Scene Schemas --
export const selectSceneSchema: z.ZodObject<any> = createSelectSchema(schema.scenesTable, {
  createdAt: z.date(),
  startedAt: z.date(),
  endedAt: z.date().nullable(),
  isActive: z.boolean(),
});
export const insertSceneSchema: z.ZodObject<any> = createInsertSchema(schema.scenesTable, {
  id: z.string().uuid(),
  createdAt: z.date().optional(),
  startedAt: z.date(),
  endedAt: z.date().optional().nullable(),
  isActive: z.boolean().optional(),
});

// -- Scene State Snapshot Schemas --
export const selectSceneStateSnapshotSchema: z.ZodObject<any> = createSelectSchema(
  schema.sceneStateSnapshotsTable,
  {
    timestamp: z.date(),
  },
);
export const insertSceneStateSnapshotSchema: z.ZodObject<any> = createInsertSchema(
  schema.sceneStateSnapshotsTable,
  {
    id: z.string().uuid(),
    timestamp: z.date().optional(),
  },
);

// -- Character Schemas --
export const selectCharacterSchema: z.ZodObject<any> = createSelectSchema(schema.charactersTable);
export const insertCharacterSchema: z.ZodObject<any> = createInsertSchema(schema.charactersTable, {
  id: z.string(),
  color: z.string().optional().nullable(),
});

// -- Message Schemas --
export const selectMessageSchema: z.ZodObject<any> = createSelectSchema(schema.messagesTable, {
  timestamp: z.date(),
  calculatedSpeakingTime: z.number().nullable(),
  conversationRating: z.number().int().nullable(),
  endConversation: z.boolean().nullable(),
  tokenCount: z.number().int().nullable(),
  cost: z.number().nullable(),
});
export const insertMessageSchema: z.ZodObject<any> = createInsertSchema(schema.messagesTable, {
  id: z.string().uuid(),
  timestamp: z.date().optional(),
  sceneId: z.string(),
  characterId: z.string(),
  calculatedSpeakingTime: z.number().optional().nullable(),
  conversationRating: z.number().int().optional().nullable(),
  endConversation: z.boolean().optional(),
  tokenCount: z.number().int().optional().nullable(),
  cost: z.number().optional().nullable(),
});
