import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { uuid } from '../../uuid'; // Import uuid helper

// TODO: Define agent table if needed or confirm agentId source

/**
 * Stores distilled facts and beliefs extracted from agent experiences or reflection.
 * Part of the Semantic Memory system.
 */
export const semanticFacts = sqliteTable(
  'semantic_facts',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => uuid()), // Use text UUID
    agentId: text('agent_id').notNull(),
    subjectVisualId: text('subject_visual_id').notNull(),
    key: text('key').notNull(),
    value: text('value', { mode: 'json' }).notNull().$type<any>(),
    confidence: real('confidence').notNull().default(1.0),
    lastUpdated: integer('last_updated', { mode: 'timestamp_ms' }).notNull().defaultNow(),
    provenance: text('provenance', { mode: 'json' }).$type<string[]>().default([]),
    embedding: text('embedding', { mode: 'json' }),
  },
  (table) => [
    index('fact_agent_id_idx').on(table.agentId),
    index('fact_subject_visual_id_idx').on(table.subjectVisualId),
    index('fact_key_idx').on(table.key),
  ],
);

// Example relation (if an 'agents' table exists)
// export const semanticFactRelations = relations(semanticFacts, ({ one }) => ({
//   agent: one(agents, {
//     fields: [semanticFacts.agentId],
//     references: [agents.id],
//   }),
// }));
