import { relations } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { uuid } from '../../uuid'; // Import uuid helper
import { planStatusEnum, plans } from './plans.schema';

// TODO: Define agent table if needed or confirm agentId source

/**
 * Stores individual nodes within a hierarchical plan (HTN).
 * Each node represents a task or sub-goal.
 */
export const planNodes = sqliteTable(
  'plan_nodes',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => uuid()), // Use text UUID
    planId: text('plan_id') // Change FK to text
      .notNull()
      .references(() => plans.id, { onDelete: 'cascade' }),
    agentId: text('agent_id').notNull(), // Agent who owns this plan node
    parentId: text('parent_id').references((): any => planNodes.id, {
      // Change self-ref FK to text
      onDelete: 'cascade',
    }), // Optional link to parent node for hierarchy
    description: text('description').notNull(), // Description of the task/sub-goal
    // Store status as text
    status: text('status', { enum: planStatusEnum }).notNull().default('pending'),
    // Store toolCall and result as text, let Drizzle parse based on $type
    toolCall: text('tool_call', { mode: 'json' }).$type<{
      tool: string;
      params: Record<string, any>;
    }>(),
    result: text('result', { mode: 'json' }),
    // Store timestamps as integers (Unix epoch milliseconds)
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().defaultNow(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().defaultNow(),
  },
  (table) => [
    index('node_plan_id_idx').on(table.planId),
    index('node_parent_id_idx').on(table.parentId),
    index('node_agent_id_idx').on(table.agentId),
    index('node_status_idx').on(table.status),
  ],
);

// Define relations for Drizzle ORM usage (syntax remains the same)
export const planNodeRelations = relations(planNodes, ({ one, many }) => ({
  plan: one(plans, {
    fields: [planNodes.planId],
    references: [plans.id],
  }),
  parent: one(planNodes, {
    fields: [planNodes.parentId],
    references: [planNodes.id],
    relationName: 'children',
  }),
  children: many(planNodes, {
    relationName: 'children',
  }),
  // agent: one(agents, { ... })
}));

// Define the inverse relation on the plans table (syntax remains the same)
export const planRelations = relations(plans, ({ many }) => ({
  nodes: many(planNodes), // A plan has many nodes
}));
