import { sql } from 'drizzle-orm'; // For potential default values like timestamps
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Example Table - Replace with your actual schema from pixeltales.db
export const conversationsTable = sqliteTable('conversations', {
  id: text('id').primaryKey(), // Assuming UUIDs stored as text
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
  // Add other columns...
});

export const messagesTable = sqliteTable('messages', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').references(() => conversationsTable.id),
  characterId: text('character_id'), // Or define a charactersTable
  modelUsed: text('model_used'),
  content: text('content').notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp_ms' })
    .default(sql`(unixepoch() * 1000)`)
    .notNull(),
  // Add other relevant columns like token count, cost, etc.
});

// Add other tables (characters, scenes, etc.) here
