import { relations } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { uuid } from '../../uuid'; // Import uuid helper
import { hypotheses } from './hypotheses.schema';

// TODO: Define agent table if needed or confirm agentId source

export const experimentStatusEnum = [
  'planned',
  'running',
  'completed',
  'failed',
  'aborted',
] as const;
export type ExperimentStatus = (typeof experimentStatusEnum)[number];

/**
 * Stores details about experiments designed and run by agents
 * to test specific hypotheses.
 */
export const experiments = sqliteTable(
  'experiments',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => uuid()), // Use text UUID
    agentId: text('agent_id').notNull(), // Agent conducting the experiment
    hypothesisId: text('hypothesis_id') // Change FK to text
      .notNull()
      .references(() => hypotheses.id, { onDelete: 'cascade' }), // Link to the hypothesis being tested
    description: text('description').notNull(), // Description of the experimental procedure
    // Store status as text
    status: text('status', { enum: experimentStatusEnum }).notNull().default('planned'),
    // Store timestamps as integers (Unix epoch milliseconds)
    startTime: integer('start_time', { mode: 'timestamp_ms' }),
    endTime: integer('end_time', { mode: 'timestamp_ms' }),
    // Store results as text, let Drizzle parse based on $type
    resultData: text('result_data', { mode: 'json' }).$type<Record<string, any>>(),
    resultSummary: text('result_summary'),
    resultConfidenceUpdate: real('result_confidence_update'), // Change in confidence for the linked hypothesis
    // Store timestamp as integer (Unix epoch milliseconds)
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().defaultNow(),
  },
  (table) => [
    index('experiment_agent_id_idx').on(table.agentId),
    index('experiment_hypothesis_id_idx').on(table.hypothesisId),
    index('experiment_status_idx').on(table.status),
  ],
);

// Define relations for Drizzle ORM usage (syntax remains the same)
export const experimentRelations = relations(experiments, ({ one }) => ({
  hypothesis: one(hypotheses, {
    fields: [experiments.hypothesisId],
    references: [hypotheses.id],
  }),
  // agent: one(agents, { ... })
}));

// Define the inverse relation on the hypotheses table (syntax remains the same)
// Note: Need to import 'experiments' in hypotheses.schema.ts if defining there
export const hypothesisRelations = relations(hypotheses, ({ many }) => ({
  experiments: many(experiments),
}));
