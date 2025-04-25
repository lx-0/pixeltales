import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { uuid } from '../../uuid'; // Import uuid helper

// TODO: Define agent table if needed or confirm agentId source

/**
 * Stores the agent's explicit self-model, including perceived capabilities,
 * limitations, role understanding, and metacognitive insights.
 * Supports the Self-Modeling System (2.11).
 */
export const agentSelfModels = sqliteTable(
  'agent_self_models',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => uuid()), // Use text UUID
    agentId: text('agent_id').notNull().unique(), // Each agent has one primary self-model entry
    // Store complex data as text, let Drizzle parse based on $type
    capabilities: text('capabilities', { mode: 'json' }).$type<
      Record<string, { confidence: number }>
    >(), // e.g., { 'can_speak_french': { confidence: 0.8 } }
    boundaries: text('boundaries', { mode: 'json' }).$type<Record<string, any>>(), // Known limitations or rules (e.g., {'cannot_access_filesystem': true})
    roleConcept: text('role_concept'), // Textual description of the agent's understanding of its current role
    personaSummary: text('persona_summary'), // Agent's summary of its own personality/traits
    cognitiveStyle: text('cognitive_style', { mode: 'json' }), // Agent's understanding of its thinking patterns
    // Store timestamp as integer (Unix epoch milliseconds)
    lastUpdated: integer('last_updated', { mode: 'timestamp_ms' }).notNull().defaultNow(),
  },
  (table) => [
    // Unique constraint on agentId implicitly creates an index usually
    index('self_model_agent_id_idx').on(table.agentId),
  ],
);

// Potential future: Historical snapshots of self-model could be stored in a related table
// if tracking the evolution of self-awareness becomes important.
