import { sql } from 'drizzle-orm';

export function up() {
  return sql`
    -- Agent: Episodic Memory Store
    CREATE TABLE IF NOT EXISTS episodic_memory (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
      timestamp INTEGER NOT NULL,
      content TEXT NOT NULL,
      associated_visual_ids TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS episodic_memory_conversation_idx ON episodic_memory (conversation_id);

    -- Agent: Semantic Memory Store
    CREATE TABLE IF NOT EXISTS semantic_memory (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
      subject_visual_id TEXT,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      confidence REAL NOT NULL,
      timestamp INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS semantic_memory_conversation_idx ON semantic_memory (conversation_id);

    -- Agent: HTN Plan Nodes
    CREATE TABLE IF NOT EXISTS plan_nodes (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
      parent_id TEXT,
      description TEXT NOT NULL,
      status TEXT NOT NULL,
      data TEXT,
      timestamp INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS plan_nodes_conversation_idx ON plan_nodes (conversation_id);

    -- Agent: Metrics
    CREATE TABLE IF NOT EXISTS metrics (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      tags TEXT NOT NULL,
      fields TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS metrics_name_idx ON metrics (name);

    -- Agent: Reward Records
    CREATE TABLE IF NOT EXISTS rewards (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
      agent_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
      reward_score REAL NOT NULL,
      timestamp INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS rewards_conversation_idx ON rewards (conversation_id);
  `;
}

export function down() {
  return sql`
    DROP TABLE IF EXISTS rewards;
    DROP TABLE IF EXISTS metrics;
    DROP TABLE IF EXISTS plan_nodes;
    DROP TABLE IF EXISTS semantic_memory;
    DROP TABLE IF EXISTS episodic_memory;
  `;
}
