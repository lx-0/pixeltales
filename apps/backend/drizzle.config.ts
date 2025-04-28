import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

// Use the symlink path relative to this config file (apps/backend/)
export const symlinkPathRelativeToConfig = '../../data/sqlite/pixeltales.db';

// Use environment variable if set, otherwise use the default relative symlink path
const dbUrl = process.env.DATABASE_URL ?? symlinkPathRelativeToConfig;

export default defineConfig({
  out: './src/db/migrations', // Output directory for migrations
  // Point to the schema source file in the database package
  schema: '../../packages/database/src/db-schema.ts', // TODO reference FULL dbSchema
  dialect: 'sqlite', // Specify SQLite dialect
  // driver: 'better-sqlite3', // Driver is inferred for sqlite
  dbCredentials: {
    url: dbUrl, // Use path relative to this config file
  },
  verbose: true, // Optional: Enable verbose logging
  strict: true, // Optional: Enable strict mode for type checking
});
