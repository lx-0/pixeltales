import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { uuid } from '../../uuid'; // Import uuid helper

// TODO: Define agent table if needed or confirm agentId source
// Assuming agentId might relate to a future 'agents' table or is just an identifier

/**
 * Stores chronological entries of agent observations and experiences.
 * Corresponds to Episodic Memory in the agent architecture.
 */
export const episodicMemoryEntries = sqliteTable(
  'episodic_memory_entries',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => uuid()), // Use text UUID
    agentId: text('agent_id').notNull(), // ID of the agent experiencing the event
    conversationId: text('conversation_id'), // Optional: Link to a specific conversation
    // Store timestamp as integer (Unix epoch milliseconds)
    timestamp: integer('timestamp', { mode: 'timestamp_ms' }).notNull().defaultNow(),
    eventType: text('event_type').notNull(), // e.g., 'message_received', 'action_taken', 'scene_update'
    content: text('content').notNull(), // The textual content of the observation/experience
    // Store JSON as text, Drizzle handles parsing based on $type
    associatedVisualIds: text('associated_visual_ids', { mode: 'json' }).$type<string[]>(),
    metadata: text('metadata', { mode: 'json' }).$type<Record<string, any>>(),
    embedding: text('embedding', { mode: 'json' }), // Store embedding as JSON text
  },
  (table) => [
    index('episodic_agent_id_idx').on(table.agentId),
    index('episodic_timestamp_idx').on(table.timestamp),
    index('episodic_event_type_idx').on(table.eventType),
    // GIN indexes are not standard in SQLite. Full-text search (FTS) or JSON functions might be used.
  ],
);

// Relations might need adjustments based on SQLite FK capabilities if defined later
