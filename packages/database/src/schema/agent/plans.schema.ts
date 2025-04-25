import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { uuid } from '../../uuid'; // Import uuid helper

// TODO: Define agent table if needed or confirm agentId source

// Define enum values for SQLite text column
export const planStatusEnum = [
  'pending',
  'in_progress',
  'completed',
  'failed',
  'cancelled',
] as const;
export type PlanStatus = (typeof planStatusEnum)[number];

/**
 * Stores high-level plans or goals for agents.
 * Each plan consists of a hierarchy of plan nodes.
 */
export const plans = sqliteTable(
  'plans',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => uuid()), // Use text UUID
    agentId: text('agent_id').notNull(), // Agent who owns this plan
    rootGoal: text('root_goal').notNull(), // Description of the overall goal
    // Store status as text
    status: text('status', { enum: planStatusEnum }).notNull().default('pending'),
    // Store timestamps as integers (Unix epoch milliseconds)
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().defaultNow(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().defaultNow(),
  },
  (table) => [
    index('plan_agent_id_idx').on(table.agentId),
    index('plan_status_idx').on(table.status),
  ],
);

// Relation to plan nodes (one-to-many)
// Defined fully in plan-nodes.schema.ts to avoid circular dependencies if imported here
// export const planRelations = relations(plans, ({ many }) => ({
//   nodes: many(planNodes),
// }));
