import { sql } from 'drizzle-orm';

export function up() {
  return sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user')),
      created_at INTEGER NOT NULL DEFAULT (cast(strftime('%s', 'now') as integer) * 1000),
      updated_at INTEGER NOT NULL DEFAULT (cast(strftime('%s', 'now') as integer) * 1000)
    );

    CREATE INDEX IF NOT EXISTS user_email_idx ON users(email);
  `;
}

export function down() {
  return sql`
    DROP TABLE IF EXISTS users;
  `;
}
