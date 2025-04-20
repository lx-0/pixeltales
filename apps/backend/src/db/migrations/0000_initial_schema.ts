import { sql } from 'drizzle-orm';

export function up() {
  return sql`
    CREATE TABLE IF NOT EXISTS scene_configs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      system_prompt TEXT NOT NULL DEFAULT '',
      characters_config TEXT NOT NULL,
      start_character_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'proposed',
      proposer_name TEXT,
      proposed_at INTEGER,
      votes INTEGER NOT NULL DEFAULT 0,
      comments TEXT NOT NULL DEFAULT '[]',
      created_at INTEGER NOT NULL DEFAULT (cast(strftime('%s', 'now') as integer) * 1000),
      custom TEXT NOT NULL DEFAULT '{}'
    );

    CREATE INDEX IF NOT EXISTS scene_config_created_at_idx ON scene_configs (created_at);
    CREATE INDEX IF NOT EXISTS scene_config_status_idx ON scene_configs (status);

    CREATE TABLE IF NOT EXISTS scenes (
      id TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL DEFAULT (cast(strftime('%s', 'now') as integer) * 1000),
      config_id TEXT NOT NULL,
      FOREIGN KEY (config_id) REFERENCES scene_configs (id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS scene_created_at_idx ON scenes (created_at);
    CREATE INDEX IF NOT EXISTS scene_config_id_idx ON scenes (config_id);

    CREATE TABLE IF NOT EXISTS scene_state_snapshots (
      id TEXT PRIMARY KEY,
      timestamp INTEGER NOT NULL DEFAULT (cast(strftime('%s', 'now') as integer) * 1000),
      config_id TEXT NOT NULL,
      scene_id TEXT NOT NULL,
      characters TEXT NOT NULL,
      messages TEXT NOT NULL DEFAULT '[]',
      started_at INTEGER NOT NULL,
      conversation_active INTEGER NOT NULL,
      conversation_ended INTEGER NOT NULL DEFAULT 0,
      ended_at INTEGER,
      custom TEXT NOT NULL,
      FOREIGN KEY (config_id) REFERENCES scene_configs (id),
      FOREIGN KEY (scene_id) REFERENCES scenes (id)
    );

    CREATE INDEX IF NOT EXISTS snapshot_timestamp_idx ON scene_state_snapshots (timestamp);
    CREATE INDEX IF NOT EXISTS snapshot_scene_id_idx ON scene_state_snapshots (scene_id);

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user')),
      created_at INTEGER NOT NULL DEFAULT (cast(strftime('%s', 'now') as integer) * 1000),
      updated_at INTEGER NOT NULL DEFAULT (cast(strftime('%s', 'now') as integer) * 1000)
    );

    CREATE INDEX IF NOT EXISTS user_email_idx ON users(email);

    -- Create characters table
    CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT
    );

    CREATE INDEX IF NOT EXISTS character_name_idx ON characters (name);

    -- Create messages table
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      timestamp INTEGER NOT NULL DEFAULT (cast(strftime('%s', 'now') as integer) * 1000),
      scene_id TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
      character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
      recipient TEXT NOT NULL,
      model_used TEXT,
      content TEXT,
      thoughts TEXT NOT NULL,
      mood TEXT NOT NULL,
      mood_emoji TEXT NOT NULL,
      reaction_on_previous_message TEXT,
      calculated_speaking_time REAL NOT NULL,
      conversation_rating INTEGER,
      end_conversation INTEGER DEFAULT 0 NOT NULL,
      token_count INTEGER,
      cost REAL
    );

    CREATE INDEX IF NOT EXISTS message_timestamp_idx ON messages (timestamp);
    CREATE INDEX IF NOT EXISTS message_scene_id_idx ON messages (scene_id);
    CREATE INDEX IF NOT EXISTS message_character_id_idx ON messages (character_id);
  `;
}

export function down() {
  return sql`
    DROP TABLE IF EXISTS scene_state_snapshots;
    DROP TABLE IF EXISTS scenes;
    DROP TABLE IF EXISTS scene_configs;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS messages;
    DROP TABLE IF EXISTS characters;
  `;
}
