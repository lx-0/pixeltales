import { sql } from 'drizzle-orm';

export function up() {
  return sql`
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
      scene_id INTEGER NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
      character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
      model_used TEXT,
      content TEXT,
      thoughts TEXT NOT NULL,
      mood TEXT NOT NULL,
      mood_emoji TEXT NOT NULL,
      recipient TEXT NOT NULL,
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
    DROP TABLE IF EXISTS messages;
    DROP TABLE IF EXISTS characters;
  `;
}
