import { relations, sql } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { nanoid } from 'nanoid';
import {
  CharacterConfig,
  CharacterState,
  Comment,
  Message,
  SceneConfigCustom,
  SceneStateSnapshotCustom,
  UserRoleEnum,
} from './schemas';

// UUID Generator
export const uuid = nanoid;

const sqlNow = sql`(cast(strftime('%s', 'now') as integer) * 1000)`;

// --- Tables ---

// Users table for authentication and role management
export const usersTable = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(), // Supabase auth ID
    email: text('email').notNull().unique(),
    name: text('name'),
    role: text('role', { enum: UserRoleEnum }).default('user').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).default(sqlNow).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).default(sqlNow).notNull(),
  },
  (table) => [index('user_email_idx').on(table.email)],
);
export type DbUser = typeof usersTable.$inferSelect;
export type NewDbUser = typeof usersTable.$inferInsert;

export const sceneConfigsTable = sqliteTable(
  'scene_configs',
  {
    // id: uuid('id').primaryKey().defaultRandom(), // not supported in sqlite
    id: text('id')
      .primaryKey()
      .$defaultFn(() => uuid()),
    name: text('name').notNull(),
    description: text('description').notNull(),
    systemPrompt: text('system_prompt').default('').notNull(), // TODO v2: remove as already in `config`
    charactersConfig: text('characters_config').notNull(),
    startCharacterId: text('start_character_id').notNull(),
    status: text('status', { enum: ['proposed', 'active', 'rejected'] })
      .default('proposed')
      .notNull(),
    proposerName: text('proposer_name'),
    proposedAt: integer('proposed_at', { mode: 'timestamp_ms' }),
    votes: integer('votes').default(0).notNull(),
    comments: text('comments').default("'[]'").notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).default(sqlNow).notNull(),
    custom: text('custom').default("'{}'").notNull(),
  },
  (table) => [
    index('scene_config_created_at_idx').on(table.createdAt),
    index('scene_config_status_idx').on(table.status),
  ],
);
export type DbSceneConfigRaw = typeof sceneConfigsTable.$inferSelect;
export type DbSceneConfig = Omit<DbSceneConfigRaw, 'charactersConfig' | 'comments' | 'custom'> & {
  charactersConfig: Record<string, CharacterConfig>;
  comments: Comment[];
  custom: SceneConfigCustom;
};
export type NewDbSceneConfigRaw = typeof sceneConfigsTable.$inferInsert;
export type NewDbSceneConfig = Omit<
  NewDbSceneConfigRaw,
  'charactersConfig' | 'comments' | 'custom'
> & {
  charactersConfig: Record<string, CharacterConfig>;
  comments?: Comment[];
  custom?: SceneConfigCustom;
};
export type UpdateDbSceneConfigRaw = Partial<Omit<DbSceneConfigRaw, 'id'>>;
export type UpdateDbSceneConfig = Omit<
  UpdateDbSceneConfigRaw,
  'charactersConfig' | 'comments' | 'custom'
> & {
  charactersConfig?: Record<string, CharacterConfig>;
  comments?: Comment[];
  custom?: SceneConfigCustom;
};

export const scenesTable = sqliteTable(
  'scenes',
  {
    // id: uuid('id').primaryKey().defaultRandom(), // not supported in sqlite
    id: text('id')
      .primaryKey()
      .$defaultFn(() => uuid()),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).default(sqlNow).notNull(),
    configId: text('config_id')
      .notNull()
      .references(() => sceneConfigsTable.id, { onDelete: 'cascade' }),
    // startedAt: integer('started_at', { mode: 'timestamp_ms' }).notNull(),
    // endedAt: integer('ended_at', { mode: 'timestamp_ms' }),
    // isActive: integer('is_active', { mode: 'boolean' }).default(false).notNull(), // For currently active scene
  },
  (table) => [
    index('scene_created_at_idx').on(table.createdAt),
    index('scene_config_id_idx').on(table.configId),
    // index('scene_is_active_idx').on(table.isActive),
  ],
);
export type DbScene = typeof scenesTable.$inferSelect;
export type NewDbScene = typeof scenesTable.$inferInsert;

export const sceneStateSnapshotsTable = sqliteTable(
  'scene_state_snapshots',
  {
    // id: uuid('id').primaryKey().defaultRandom(), // not supported in sqlite
    id: text('id')
      .primaryKey()
      .$defaultFn(() => uuid()),
    timestamp: integer('timestamp', { mode: 'timestamp_ms' }).default(sqlNow).notNull(),
    configId: text('config_id')
      .notNull()
      .references(() => sceneConfigsTable.id),
    sceneId: text('scene_id')
      .notNull()
      .references(() => scenesTable.id),
    characters: text('characters').notNull(),
    messages: text('messages').default("'[]'").notNull(),
    startedAt: integer('started_at', { mode: 'timestamp_ms' }).notNull(),
    conversationActive: integer('conversation_active', { mode: 'boolean' }).notNull(),
    conversationEnded: integer('conversation_ended', { mode: 'boolean' }).default(false).notNull(),
    endedAt: integer('ended_at', { mode: 'timestamp_ms' }),
    custom: text('custom').notNull(),
  },
  (table) => [
    index('snapshot_timestamp_idx').on(table.timestamp),
    index('snapshot_scene_id_idx').on(table.sceneId),
  ],
);
export type DbSceneStateSnapshotRaw = typeof sceneStateSnapshotsTable.$inferSelect;
export type DbSceneStateSnapshot = Omit<
  DbSceneStateSnapshotRaw,
  'characters' | 'messages' | 'custom'
> & {
  characters: Record<string, CharacterState>;
  messages: Message[];
  custom: SceneStateSnapshotCustom;
};
export type NewDbSceneStateSnapshotRaw = typeof sceneStateSnapshotsTable.$inferInsert;
export type NewDbSceneStateSnapshot = Omit<
  NewDbSceneStateSnapshotRaw,
  'characters' | 'messages' | 'custom'
> & {
  characters: Record<string, CharacterState>;
  messages: Message[];
  custom: SceneStateSnapshotCustom;
};
export type UpdateDbSceneStateSnapshotRaw = Partial<Omit<DbSceneStateSnapshotRaw, 'id'>>;
export type UpdateDbSceneStateSnapshot = Omit<
  UpdateDbSceneStateSnapshotRaw,
  'characters' | 'messages' | 'custom'
> & {
  characters?: Record<string, CharacterState>;
  messages?: Message[];
  custom?: SceneStateSnapshotCustom;
};

// Characters Table (Basisdaten)
export const charactersTable = sqliteTable(
  'characters',
  {
    // id: text('id').primaryKey(), // Character ID like "bob", "alice" // TODO v2: UUID als Text
    id: text('id')
      .primaryKey()
      .$defaultFn(() => uuid()),
    name: text('name').notNull(),
    color: text('color'), // Optional? Based on Pydantic model
  },
  (table) => [index('character_name_idx').on(table.name)],
);
export type DbCharacter = typeof charactersTable.$inferSelect;
export type NewDbCharacter = typeof charactersTable.$inferInsert;

// Messages Table
export const messagesTable = sqliteTable(
  'messages',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => uuid()),
    timestamp: integer('timestamp', { mode: 'timestamp_ms' }).default(sqlNow).notNull(),
    sceneId: text('scene_id')
      .notNull()
      .references(() => scenesTable.id, { onDelete: 'cascade' }),
    characterId: text('character_id')
      .notNull()
      .references(() => charactersTable.id, { onDelete: 'cascade' }),
    recipient: text('recipient').notNull(),
    modelUsed: text('model_used'),
    content: text('content'), // Hauptnachricht
    thoughts: text('thoughts').notNull(), // Agent thoughts
    mood: text('mood').notNull(),
    moodEmoji: text('mood_emoji').notNull(),
    reactionOnPreviousMessage: text('reaction_on_previous_message'),
    calculatedSpeakingTime: real('calculated_speaking_time').notNull(), // Use real for float
    conversationRating: integer('conversation_rating'),
    endConversation: integer('end_conversation', { mode: 'boolean' }).default(false).notNull(),
    tokenCount: integer('token_count'),
    cost: real('cost'),
  },
  (table) => [
    index('message_timestamp_idx').on(table.timestamp),
    index('message_scene_id_idx').on(table.sceneId),
    index('message_character_id_idx').on(table.characterId),
  ],
);
export type DbMessage = typeof messagesTable.$inferSelect;
export type NewDbMessage = typeof messagesTable.$inferInsert;

// --- Relations ---

export const sceneConfigsRelations = relations(sceneConfigsTable, ({ many }) => ({
  scenes: many(scenesTable),
  snapshots: many(sceneStateSnapshotsTable), // Direct relation for easier query?
}));

export const scenesRelations = relations(scenesTable, ({ one, many }) => ({
  config: one(sceneConfigsTable, {
    fields: [scenesTable.configId],
    references: [sceneConfigsTable.id],
  }),
  snapshots: many(sceneStateSnapshotsTable),
  messages: many(messagesTable),
}));

export const sceneStateSnapshotsRelations = relations(sceneStateSnapshotsTable, ({ one }) => ({
  scene: one(scenesTable, {
    fields: [sceneStateSnapshotsTable.sceneId],
    references: [scenesTable.id],
  }),
  // config relation removed, access via scene.config
}));

export const charactersRelations = relations(charactersTable, ({ many }) => ({
  messages: many(messagesTable),
}));

export const messagesRelations = relations(messagesTable, ({ one }) => ({
  scene: one(scenesTable, {
    fields: [messagesTable.sceneId],
    references: [scenesTable.id],
  }),
  character: one(charactersTable, {
    fields: [messagesTable.characterId],
    references: [charactersTable.id],
  }),
}));

export const dbSchema = {
  sceneConfigsTable,
  scenesTable,
  sceneStateSnapshotsTable,
  charactersTable,
  messagesTable,
  usersTable,
};
