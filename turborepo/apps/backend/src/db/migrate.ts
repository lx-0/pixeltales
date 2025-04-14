import BetterSqlite3 from 'better-sqlite3';
import 'dotenv/config'; // Make sure environment variables are loaded
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import fs from 'node:fs';
import path from 'node:path';

console.log('🚀 Starting database migration...');

// --- Database Connection ---
// Path relative to CWD (apps/backend/)
const defaultDbPathRelativeToBackendRoot = '../data/sqlite/pixeltales.db';
const dbPathSetting = process.env.DATABASE_URL ?? defaultDbPathRelativeToBackendRoot;

let dbPath: string;
if (path.isAbsolute(dbPathSetting)) {
  dbPath = dbPathSetting;
} else {
  // Resolve relative to CWD (which is apps/backend when running script)
  dbPath = path.resolve(process.cwd(), dbPathSetting);
}

console.log(`Database path resolved to: ${dbPath}`);

// Ensure directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  console.error(`❌ Error: Database directory does not exist: ${dbDir}`);
  process.exit(1);
}
console.log(`Database directory exists: ${dbDir}`);

let sqlite;
try {
  sqlite = new BetterSqlite3(dbPath);
  sqlite.pragma('journal_mode = WAL'); // Optional: WAL mode
  console.log('✅ SQLite connection opened successfully.');
} catch (error) {
  console.error('❌ Failed to open SQLite connection:', error);
  process.exit(1);
}

const db = drizzle(sqlite);

// --- Migration Execution ---
// Path relative to THIS script file (apps/backend/src/db/migrate.ts)
const migrationsFolder = path.resolve(__dirname, '../../packages/database/src/db/migrations');
console.log(`Looking for migrations in: ${migrationsFolder}`);

if (!fs.existsSync(migrationsFolder)) {
  console.warn(`⚠️ Migrations folder not found at ${migrationsFolder}. Skipping migration.`);
} else {
  try {
    console.log('Applying migrations...');
    migrate(db, { migrationsFolder: migrationsFolder });
    console.log('✅ Migrations applied successfully!');
  } catch (error) {
    console.error('❌ Error applying migrations:', error);
    process.exit(1);
  } finally {
    // Close the connection
    sqlite.close();
    console.log('SQLite connection closed.');
  }
}
