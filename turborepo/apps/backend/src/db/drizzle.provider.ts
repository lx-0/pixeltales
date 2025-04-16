import { FactoryProvider, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { dbSchema } from '@pixeltales/database';
import BetterSqlite3 from 'better-sqlite3';
import { BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3';
import { symlinkPathRelativeToConfig } from 'drizzle.config';
import * as fs from 'fs';
import * as path from 'node:path';

export const DRIZZLE_INSTANCE = 'DRIZZLE_INSTANCE';

export type DrizzleSqliteDatabase = BetterSQLite3Database<typeof dbSchema>;

export const DrizzleProvider: FactoryProvider<DrizzleSqliteDatabase> = {
  provide: DRIZZLE_INSTANCE,
  inject: [ConfigService, Logger],
  useFactory: (configService: ConfigService, logger: Logger) => {
    // Default path using the symlink, relative to CWD (apps/backend)
    const dbPathSetting = configService.get<string>('DATABASE_URL', symlinkPathRelativeToConfig);

    let dbPath: string;
    if (path.isAbsolute(dbPathSetting)) {
      dbPath = dbPathSetting;
    } else {
      // Resolve relative to the current working directory (assumed to be apps/backend)
      dbPath = path.resolve(process.cwd(), dbPathSetting);
    }

    logger.log(
      `Attempting to connect to SQLite database via symlink path: ${dbPath}`,
      'DrizzleProvider',
    );

    // Check if the directory exists (for the symlink path)
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      // This check might fail if the symlink itself points to a non-existent dir/file
      // but it's a basic sanity check for the path structure within turborepo
      logger.warn(
        `Symlink directory path does not seem to exist locally: ${dbDir}. Relying on symlink target.`,
        'DrizzleProvider',
      );
      // We might not want to throw here, as the symlink target is what matters.
      // throw new Error(`Database directory not found: ${dbDir}`);
    }
    // logger.log(`Database directory found: ${dbDir}`, 'DrizzleProvider');

    try {
      // better-sqlite3 should resolve the symlink
      const sqlite = new BetterSqlite3(dbPath);
      logger.log('SQLite connection opened successfully', 'DrizzleProvider');

      sqlite.pragma('journal_mode = WAL');
      logger.log('WAL mode enabled', 'DrizzleProvider');

      // Benutzerdefinierter Logger für Drizzle, der NestJS-Logger verwendet
      const customLogger = {
        logQuery: (query: string, params: unknown[]) => {
          const formattedParams = params.map((p) => JSON.stringify(p)).join(', ');
          logger.debug(`Query: ${query} -- params: [${formattedParams}]`, 'DrizzleORM');
        },
      };

      const db = drizzle(sqlite, {
        schema: dbSchema,
        logger: configService.get<boolean>('DB_DEBUG_LOGGING', false) ? customLogger : false,
      });

      logger.log('Drizzle instance created successfully', 'DrizzleProvider');
      return db;
    } catch (error) {
      logger.error(`Failed to connect to SQLite database at ${dbPath}`, error, 'DrizzleProvider');
      if (error instanceof Error) {
        logger.error(
          `Error name: ${error.name}, message: ${error.message}, stack: ${error.stack}`,
          'DrizzleProvider',
        );
      } else {
        logger.error('Caught non-Error object:', error, 'DrizzleProvider');
      }
      throw error;
    }
  },
};
