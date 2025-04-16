import Database from 'better-sqlite3';
import { BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3';
import * as path from 'path';
import * as schema from './db-schema';

// Configuration options
interface DatabaseOptions {
  dbPath?: string;
}

// Default sqlite path
const DEFAULT_DB_PATH = path.resolve(process.cwd(), 'data.db');

// Singleton to hold database instance
let dbInstance: BetterSQLite3Database<typeof schema> | null = null;

/**
 * Get a database connection
 * @param options Configuration options for the database
 * @returns A drizzle database instance
 */
export async function getDb(
  options: DatabaseOptions = {},
): Promise<BetterSQLite3Database<typeof schema>> {
  // If already initialized, return the instance
  if (dbInstance) {
    return dbInstance;
  }

  // Determine database file path
  const dbPath = options.dbPath || process.env.DATABASE_URL || DEFAULT_DB_PATH;

  console.log(`Initializing SQLite database at: ${dbPath}`);

  // Initialize SQLite connection
  const sqlite = new Database(dbPath, {
    // Add better-sqlite3 options as needed
    fileMustExist: false, // Create if doesn't exist
  });

  // Create drizzle instance
  dbInstance = drizzle(sqlite, { schema });

  return dbInstance;
}

/**
 * Close the database connection
 */
export function closeDb(): void {
  if (dbInstance) {
    const sqlite = (dbInstance as any).driver?.db;
    if (sqlite && typeof sqlite.close === 'function') {
      sqlite.close();
    }
    dbInstance = null;
    console.log('Database connection closed');
  }
}

// Export the schema
export { schema };
