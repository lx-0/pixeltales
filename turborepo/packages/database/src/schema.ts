import { relations, sql } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// --- Enums / Literals (aus Pydantic-Modellen abgeleitet) ---
// Es ist oft besser, diese im 'contracts'-Paket zu definieren und hier zu importieren,
// aber für die reine Schema-Definition sind sie hier als Referenz.
// export const SceneConfigStatusEnum = ['proposed', 'active', 'rejected'] as const;

// --- Tables ---

export const sceneConfigsTable = sqliteTable(
  'scene_configs',
  {
    // id: integer('id').primaryKey(), // Legacy war int
    id: text('id').primaryKey(), // Neu: UUID als Text
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(strftime('%s', 'now') as integer) * 1000)`)
      .notNull(),
    configJson: text('config_json').notNull(), // Store SceneConfigBase + system_prompt as JSON string
    votes: integer('votes').default(0).notNull(),
    status: text('status', { enum: ['proposed', 'active', 'rejected'] })
      .default('proposed')
      .notNull(),
    systemPrompt: text('system_prompt').notNull().default(''),
    // proposerName: text('proposer_name'), // War Teil der JSON-Config
    // proposedAt: integer('proposed_at', { mode: 'timestamp_ms' }), // War Teil der JSON-Config?
    // comments: json('comments') // War Teil der JSON-Config?
  },
  (table) => [
    index('scene_config_created_at_idx').on(table.createdAt),
    index('scene_config_status_idx').on(table.status),
  ],
);

export const scenesTable = sqliteTable(
  'scenes',
  {
    // id: integer('id').primaryKey(), // Legacy war int
    id: text('id').primaryKey(), // Neu: UUID als Text
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(strftime('%s', 'now') as integer) * 1000)`)
      .notNull(),
    sceneConfigId: text('scene_config_id')
      .notNull()
      .references(() => sceneConfigsTable.id, { onDelete: 'cascade' }), // FK
    startedAt: integer('started_at', { mode: 'timestamp_ms' }).notNull(),
    endedAt: integer('ended_at', { mode: 'timestamp_ms' }),
    isActive: integer('is_active', { mode: 'boolean' }).default(false).notNull(), // For currently active scene
  },
  (table) => [
    index('scene_created_at_idx').on(table.createdAt),
    index('scene_config_id_idx').on(table.sceneConfigId),
    index('scene_is_active_idx').on(table.isActive),
  ],
);

export const sceneStateSnapshotsTable = sqliteTable(
  'scene_state_snapshots',
  {
    id: text('id').primaryKey(), // Neu: UUID als Text
    timestamp: integer('timestamp', { mode: 'timestamp_ms' })
      .default(sql`(cast(strftime('%s', 'now') as integer) * 1000)`)
      .notNull(),
    stateJson: text('state_json').notNull(), // Store SceneState as JSON string
    sceneId: text('scene_id')
      .notNull()
      .references(() => scenesTable.id, { onDelete: 'cascade' }), // FK
    // config_id war redundant, kann über sceneId -> scenesTable -> sceneConfigId geholt werden
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
    id: text('id').primaryKey(), // Character ID like "bob", "alice"
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
    sceneId: text('scene_id')
      .notNull()
      .references(() => scenesTable.id, { onDelete: 'cascade' }),
    characterId: text('character_id')
      .notNull()
      .references(() => charactersTable.id, { onDelete: 'cascade' }),
    modelUsed: text('model_used'),
    content: text('content').notNull(), // Hauptnachricht
    thoughts: text('thoughts'), // Agent thoughts
    mood: text('mood'),
    moodEmoji: text('mood_emoji'),
    recipient: text('recipient'),
    reactionOnPrevious: text('reaction_on_previous'),
    calculatedSpeakingTime: real('calculated_speaking_time'), // Use real for float
    conversationRating: integer('conversation_rating'),
    endConversation: integer('end_conversation', { mode: 'boolean' }).default(false),
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

export const schema = {
  sceneConfigsTable,
  scenesTable,
  sceneStateSnapshotsTable,
  charactersTable,
  messagesTable,
};
