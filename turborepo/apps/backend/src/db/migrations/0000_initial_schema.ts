import { sql } from 'drizzle-orm';

export function up() {
  return sql`
    CREATE TABLE IF NOT EXISTS scene_configs (
      id INTEGER PRIMARY KEY,
      created_at INTEGER NOT NULL DEFAULT (cast(strftime('%s', 'now') as integer) * 1000),
      config TEXT NOT NULL,
      votes INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'proposed',
      system_prompt TEXT NOT NULL DEFAULT ''
    );

    CREATE INDEX IF NOT EXISTS scene_config_created_at_idx ON scene_configs (created_at);
    CREATE INDEX IF NOT EXISTS scene_config_status_idx ON scene_configs (status);

    CREATE TABLE IF NOT EXISTS scenes (
      id INTEGER PRIMARY KEY,
      created_at INTEGER NOT NULL DEFAULT (cast(strftime('%s', 'now') as integer) * 1000),
      config_id INTEGER NOT NULL,
      FOREIGN KEY (config_id) REFERENCES scene_configs (id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS scene_created_at_idx ON scenes (created_at);
    CREATE INDEX IF NOT EXISTS scene_config_id_idx ON scenes (config_id);

    CREATE TABLE IF NOT EXISTS scene_state_snapshots (
      id INTEGER PRIMARY KEY,
      timestamp INTEGER NOT NULL DEFAULT (cast(strftime('%s', 'now') as integer) * 1000),
      state TEXT NOT NULL,
      config_id INTEGER NOT NULL,
      scene_id INTEGER NOT NULL,
      FOREIGN KEY (config_id) REFERENCES scene_configs (id),
      FOREIGN KEY (scene_id) REFERENCES scenes (id)
    );

    CREATE INDEX IF NOT EXISTS snapshot_timestamp_idx ON scene_state_snapshots (timestamp);
    CREATE INDEX IF NOT EXISTS snapshot_scene_id_idx ON scene_state_snapshots (scene_id);
  `;
}

export function down() {
  return sql`
    DROP TABLE IF EXISTS scene_state_snapshots;
    DROP TABLE IF EXISTS scenes;
    DROP TABLE IF EXISTS scene_configs;
  `;
}
