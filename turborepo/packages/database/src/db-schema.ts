import { relations, sql } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { SceneConfig, SceneState } from './schemas';

// --- Tables ---

export const sceneConfigsTable = sqliteTable(
  'scene_configs',
  {
    id: integer('id').primaryKey(), // TODO v2: UUID als Text
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(strftime('%s', 'now') as integer) * 1000)`)
      .notNull(),
    config: text('config').$type<SceneConfig>().notNull(),
    votes: integer('votes').default(0).notNull(),
    status: text('status', { enum: ['proposed', 'active', 'rejected'] })
      .default('proposed')
      .notNull(),
    systemPrompt: text('system_prompt').notNull().default(''), // TODO v2: remove as already in `config`
  },
  (table) => [
    index('scene_config_created_at_idx').on(table.createdAt),
    index('scene_config_status_idx').on(table.status),
  ],
);

export const scenesTable = sqliteTable(
  'scenes',
  {
    id: integer('id').primaryKey(), // TODO v2: UUID als Text
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(strftime('%s', 'now') as integer) * 1000)`)
      .notNull(),
    sceneConfigId: integer('config_id')
      .notNull()
      .references(() => sceneConfigsTable.id, { onDelete: 'cascade' }),
    // startedAt: integer('started_at', { mode: 'timestamp_ms' }).notNull(),
    // endedAt: integer('ended_at', { mode: 'timestamp_ms' }),
    // isActive: integer('is_active', { mode: 'boolean' }).default(false).notNull(), // For currently active scene
  },
  (table) => [
    index('scene_created_at_idx').on(table.createdAt),
    index('scene_config_id_idx').on(table.sceneConfigId),
    // index('scene_is_active_idx').on(table.isActive),
  ],
);

export const sceneStateSnapshotsTable = sqliteTable(
  'scene_state_snapshots',
  {
    id: integer('id').primaryKey(), // TODO v2: UUID als Text
    timestamp: integer('timestamp', { mode: 'timestamp_ms' })
      .default(sql`(cast(strftime('%s', 'now') as integer) * 1000)`)
      .notNull(),
    state: text('state').$type<SceneState>().notNull(),
    configId: integer('config_id')
      .notNull()
      .references(() => sceneConfigsTable.id),
    sceneId: integer('scene_id')
      .notNull()
      .references(() => scenesTable.id),
  },
  (table) => [
    index('snapshot_timestamp_idx').on(table.timestamp),
    index('snapshot_scene_id_idx').on(table.sceneId),
  ],
);

// NEU: Characters Table (Basisdaten)
export const charactersTable = sqliteTable(
  'characters',
  {
    id: text('id').primaryKey(), // Character ID like "bob", "alice" // TODO v2: UUID als Text
    name: text('name').notNull(),
    color: text('color'), // Optional? Based on Pydantic model
  },
  (table) => [index('character_name_idx').on(table.name)],
);

// NEU: Messages Table
export const messagesTable = sqliteTable(
  'messages',
  {
    id: text('id').primaryKey(), // Neu: UUID als Text
    timestamp: integer('timestamp', { mode: 'timestamp_ms' })
      .default(sql`(cast(strftime('%s', 'now') as integer) * 1000)`)
      .notNull(),
    sceneId: integer('scene_id')
      .notNull()
      .references(() => scenesTable.id, { onDelete: 'cascade' }),
    characterId: text('character_id')
      .notNull()
      .references(() => charactersTable.id, { onDelete: 'cascade' }),
    modelUsed: text('model_used'),
    content: text('content'), // Hauptnachricht
    thoughts: text('thoughts').notNull(), // Agent thoughts
    mood: text('mood').notNull(),
    moodEmoji: text('mood_emoji').notNull(),
    recipient: text('recipient').notNull(),
    reactionOnPrevious: text('reaction_on_previous_message'),
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

// --- Relations ---

export const sceneConfigsRelations = relations(sceneConfigsTable, ({ many }) => ({
  scenes: many(scenesTable),
  snapshots: many(sceneStateSnapshotsTable), // Direct relation for easier query?
}));

export const scenesRelations = relations(scenesTable, ({ one, many }) => ({
  config: one(sceneConfigsTable, {
    fields: [scenesTable.sceneConfigId],
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
};
