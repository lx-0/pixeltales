import { relations } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { uuid } from '../../uuid';

// TODO: Define agent table if needed or confirm agentId source

/**
 * Stores the output of agent reflection cycles.
 */
export const reflectionReports = sqliteTable(
  'reflection_reports',
  {
    id: text('id').primaryKey().$defaultFn(uuid), // Use defaultFn without calling it
    agentId: text('agent_id').notNull(), // Agent who performed reflection
    trigger: text('trigger').notNull(), // Reason for reflection
    timestamp: integer('timestamp', { mode: 'timestamp_ms' }).notNull().defaultNow(),
    processedObservationIds: text('processed_observation_ids', { mode: 'json' }).$type<string[]>(), // Store as JSON array
    insights: text('insights', { mode: 'json' }).notNull().$type<any>(), // Store insights as JSON - TODO: Define Insight schema type here if needed
    potentialSelfModelUpdates: text('potential_self_model_updates', {
      mode: 'json',
    }).$type<Record<string, any>>(),
    potentialOntologyUpdates: text('potential_ontology_updates', {
      mode: 'json',
    }).$type<any[]>(), // TODO: Define OntologyUpdate schema type
    newGoalsSuggested: text('new_goals_suggested', { mode: 'json' }).$type<string[]>(),
  },
  (table) => [
    index('reflection_agent_id_idx').on(table.agentId),
    index('reflection_timestamp_idx').on(table.timestamp),
  ],
);

// Optional: Define relations if reports link directly to other tables
export const reflectionReportRelations = relations(reflectionReports, ({ one }) => ({
  // agent: one(agents, {
  //   fields: [reflectionReports.agentId],
  //   references: [agents.id],
  // }),
}));
