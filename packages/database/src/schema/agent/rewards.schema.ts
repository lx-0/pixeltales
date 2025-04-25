import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { uuid } from '../../uuid'; // Import uuid helper

// TODO: Define agent table if needed or confirm agentId source

/**
 * Stores experiences used for reinforcement learning.
 * Each entry represents a (state, action, reward) tuple.
 */
export const rewards = sqliteTable(
  'rewards',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => uuid()), // Use text UUID
    agentId: text('agent_id').notNull(), // Agent associated with the experience
    conversationId: text('conversation_id'), // Optional context: which conversation
    // Store timestamp as integer (Unix epoch milliseconds)
    timestamp: integer('timestamp', { mode: 'timestamp_ms' }).notNull().defaultNow(), // When the reward was calculated/logged
    rewardScore: real('reward_score').notNull(), // The calculated scalar reward
    // Store snapshots as text, let Drizzle parse based on $type
    stateSnapshot: text('state_snapshot', { mode: 'json' }).notNull().$type<Record<string, any>>(),
    actionTaken: text('action_taken', { mode: 'json' }).notNull().$type<Record<string, any>>(),
    learningIteration: integer('learning_iteration'), // Optional: Link to a specific learning cycle/batch
  },
  (table) => [
    index('reward_agent_id_idx').on(table.agentId),
    index('reward_timestamp_idx').on(table.timestamp),
    index('reward_iteration_idx').on(table.learningIteration),
  ],
);
