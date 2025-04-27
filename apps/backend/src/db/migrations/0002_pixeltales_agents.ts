import { sql } from 'drizzle-orm';

export function up() {
  return sql`
    -- Agent: Episodic Memory Entries (Corrected Table Name & Schema)
    CREATE TABLE IF NOT EXISTS episodic_memory_entries (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      conversation_id TEXT,
      timestamp INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      event_type TEXT NOT NULL,
      content TEXT NOT NULL,
      associated_visual_ids TEXT, -- Stored as JSON Text
      metadata TEXT, -- Stored as JSON Text
      embedding TEXT -- Stored as JSON Text
    );
    CREATE INDEX IF NOT EXISTS episodic_agent_id_idx ON episodic_memory_entries (agent_id);
    CREATE INDEX IF NOT EXISTS episodic_timestamp_idx ON episodic_memory_entries (timestamp);
    CREATE INDEX IF NOT EXISTS episodic_event_type_idx ON episodic_memory_entries (event_type);

    -- Agent: Semantic Facts (Replaces semantic_memory)
    CREATE TABLE IF NOT EXISTS semantic_facts (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      subject_visual_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL, -- Stored as JSON Text
      confidence REAL NOT NULL DEFAULT 1.0,
      last_updated INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      provenance TEXT DEFAULT '[]', -- Stored as JSON Text
      embedding TEXT -- Stored as JSON Text
    );
    CREATE INDEX IF NOT EXISTS fact_agent_id_idx ON semantic_facts (agent_id);
    CREATE INDEX IF NOT EXISTS fact_subject_visual_id_idx ON semantic_facts (subject_visual_id);
    CREATE INDEX IF NOT EXISTS fact_key_idx ON semantic_facts (key);

    -- Agent: Semantic Concepts (New Table)
    CREATE TABLE IF NOT EXISTS semantic_concepts (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      properties TEXT, -- Stored as JSON Text
      confidence REAL NOT NULL DEFAULT 1.0,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      last_updated INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      embedding TEXT -- Stored as JSON Text
    );
    CREATE INDEX IF NOT EXISTS concept_agent_id_idx ON semantic_concepts (agent_id);
    CREATE INDEX IF NOT EXISTS concept_name_idx ON semantic_concepts (name);
    CREATE INDEX IF NOT EXISTS concept_category_idx ON semantic_concepts (category);

    -- Agent: Semantic Relations (New Table)
    CREATE TABLE IF NOT EXISTS semantic_relations (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      source_concept_id TEXT NOT NULL REFERENCES semantic_concepts(id) ON DELETE CASCADE,
      target_concept_id TEXT NOT NULL REFERENCES semantic_concepts(id) ON DELETE CASCADE,
      relation_type TEXT NOT NULL,
      strength REAL DEFAULT 1.0,
      metadata TEXT, -- Stored as JSON Text
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      last_updated INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
    );
    CREATE INDEX IF NOT EXISTS relation_agent_id_idx ON semantic_relations (agent_id);
    CREATE INDEX IF NOT EXISTS relation_source_concept_id_idx ON semantic_relations (source_concept_id);
    CREATE INDEX IF NOT EXISTS relation_target_concept_id_idx ON semantic_relations (target_concept_id);
    CREATE INDEX IF NOT EXISTS relation_relation_type_idx ON semantic_relations (relation_type);

    -- Agent: Plans (New Table)
    CREATE TABLE IF NOT EXISTS plans (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      root_goal TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
    );
    CREATE INDEX IF NOT EXISTS plan_agent_id_idx ON plans (agent_id);
    CREATE INDEX IF NOT EXISTS plan_status_idx ON plans (status);

    -- Agent: Plan Nodes (Corrected Schema)
    -- Drop existing if necessary? Assuming additive changes for now.
    CREATE TABLE IF NOT EXISTS plan_nodes (
      id TEXT PRIMARY KEY,
      plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
      agent_id TEXT NOT NULL,
      parent_id TEXT REFERENCES plan_nodes(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      tool_call TEXT, -- Stored as JSON Text
      result TEXT, -- Stored as JSON Text
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
    );
    CREATE INDEX IF NOT EXISTS node_plan_id_idx ON plan_nodes (plan_id);
    CREATE INDEX IF NOT EXISTS node_parent_id_idx ON plan_nodes (parent_id);
    CREATE INDEX IF NOT EXISTS node_agent_id_idx ON plan_nodes (agent_id);
    CREATE INDEX IF NOT EXISTS node_status_idx ON plan_nodes (status);

    -- Agent: Metrics (Corrected Schema)
    -- Drop existing if necessary?
    CREATE TABLE IF NOT EXISTS metrics (
      id TEXT PRIMARY KEY,
      timestamp INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      name TEXT NOT NULL,
      tags TEXT, -- Stored as JSON Text
      fields TEXT NOT NULL -- Stored as JSON Text
    );
    CREATE INDEX IF NOT EXISTS metric_timestamp_idx ON metrics (timestamp);
    CREATE INDEX IF NOT EXISTS metric_name_idx ON metrics (name);

    -- Agent: Rewards (Corrected Schema)
    -- Drop existing if necessary?
    CREATE TABLE IF NOT EXISTS rewards (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      conversation_id TEXT,
      timestamp INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      reward_score REAL NOT NULL,
      state_snapshot TEXT NOT NULL, -- Stored as JSON Text
      action_taken TEXT NOT NULL, -- Stored as JSON Text
      learning_iteration INTEGER
    );
    CREATE INDEX IF NOT EXISTS reward_agent_id_idx ON rewards (agent_id);
    CREATE INDEX IF NOT EXISTS reward_timestamp_idx ON rewards (timestamp);
    CREATE INDEX IF NOT EXISTS reward_iteration_idx ON rewards (learning_iteration);

    -- Agent: Self Models (New Table)
    CREATE TABLE IF NOT EXISTS agent_self_models (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL UNIQUE,
      capabilities TEXT, -- Stored as JSON Text
      boundaries TEXT, -- Stored as JSON Text
      role_concept TEXT,
      persona_summary TEXT,
      cognitive_style TEXT, -- Stored as JSON Text
      last_updated INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
    );
    CREATE INDEX IF NOT EXISTS self_model_agent_id_idx ON agent_self_models (agent_id);

    -- Agent: Reflection Reports (New Table)
    CREATE TABLE IF NOT EXISTS reflection_reports (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      trigger TEXT NOT NULL,
      timestamp INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      processed_observation_ids TEXT, -- Stored as JSON Text
      insights TEXT NOT NULL, -- Stored as JSON Text
      potential_self_model_updates TEXT, -- Stored as JSON Text
      potential_ontology_updates TEXT, -- Stored as JSON Text
      new_goals_suggested TEXT -- Stored as JSON Text
    );
    CREATE INDEX IF NOT EXISTS reflection_agent_id_idx ON reflection_reports (agent_id);
    CREATE INDEX IF NOT EXISTS reflection_timestamp_idx ON reflection_reports (timestamp);

    -- Agent: Hypotheses (New Table)
    CREATE TABLE IF NOT EXISTS hypotheses (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      description TEXT NOT NULL,
      triggering_observation_id TEXT,
      status TEXT NOT NULL DEFAULT 'proposed',
      confidence REAL NOT NULL DEFAULT 0.5,
      tags TEXT, -- Stored as JSON Text
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
    );
    CREATE INDEX IF NOT EXISTS hypothesis_agent_id_idx ON hypotheses (agent_id);
    CREATE INDEX IF NOT EXISTS hypothesis_status_idx ON hypotheses (status);

    -- Agent: Experiments (New Table)
    CREATE TABLE IF NOT EXISTS experiments (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      hypothesis_id TEXT NOT NULL REFERENCES hypotheses(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'planned',
      start_time INTEGER,
      end_time INTEGER,
      result_data TEXT, -- Stored as JSON Text
      result_summary TEXT,
      result_confidence_update REAL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
    );
    CREATE INDEX IF NOT EXISTS experiment_agent_id_idx ON experiments (agent_id);
    CREATE INDEX IF NOT EXISTS experiment_hypothesis_id_idx ON experiments (hypothesis_id);
    CREATE INDEX IF NOT EXISTS experiment_status_idx ON experiments (status);
  `;
}

export function down() {
  return sql`
    DROP TABLE IF EXISTS rewards;
    DROP TABLE IF EXISTS metrics;
    DROP TABLE IF EXISTS plan_nodes;
    DROP TABLE IF EXISTS plans;
    DROP TABLE IF EXISTS semantic_relations;
    DROP TABLE IF EXISTS semantic_concepts;
    DROP TABLE IF EXISTS semantic_facts;
    DROP TABLE IF EXISTS episodic_memory_entries;
    DROP TABLE IF EXISTS experiments;
    DROP TABLE IF EXISTS hypotheses;
    DROP TABLE IF EXISTS reflection_reports;
    DROP TABLE IF EXISTS agent_self_models;
  `;
}
