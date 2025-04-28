import { FactoryProvider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { schema as pixelTalesSchema } from '@pixeltales/database';
import { usersTable } from '@yesterday-ai/user-database';
import { toBoolean } from '@yesterday-ai/utils-shared';
import BetterSqlite3 from 'better-sqlite3';
import { BetterSQLite3Database, drizzle } from 'drizzle-orm/better-sqlite3';
import { symlinkPathRelativeToConfig } from 'drizzle.config';
import * as fs from 'fs';
import { PinoLogger } from 'nestjs-pino';
import * as path from 'node:path';

export const DRIZZLE_INSTANCE = 'DRIZZLE_INSTANCE';

export const dbSchema = { ...pixelTalesSchema, usersTable };

export type DatabaseSchema = BetterSQLite3Database<typeof dbSchema>;

export const DrizzleProvider: FactoryProvider<DatabaseSchema> = {
  provide: DRIZZLE_INSTANCE,
  inject: [ConfigService, PinoLogger],
  useFactory: (configService: ConfigService, logger: PinoLogger) => {
    // Default path using the symlink, relative to CWD (apps/backend)
    const dbPathSetting = configService.get<string>('DATABASE_URL', symlinkPathRelativeToConfig);

    logger.setContext('DrizzleProvider');

    let dbPath: string;
    if (path.isAbsolute(dbPathSetting)) {
      dbPath = dbPathSetting;
    } else {
      // Resolve relative to the current working directory (assumed to be apps/backend)
      dbPath = path.resolve(process.cwd(), dbPathSetting);
    }

    logger.info(`Attempting to connect to SQLite database via symlink path: ${dbPath}`);

    // Check if the directory exists (for the symlink path)
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      // This check might fail if the symlink itself points to a non-existent dir/file
      // but it's a basic sanity check for the path structure within turborepo
      logger.warn(
        `Symlink directory path does not seem to exist locally: ${dbDir}. Relying on symlink target.`,
      );
      // We might not want to throw here, as the symlink target is what matters.
      // throw new Error(`Database directory not found: ${dbDir}`);
    }
    // logger.log(`Database directory found: ${dbDir}`, 'DrizzleProvider');

    try {
      // better-sqlite3 should resolve the symlink
      const sqlite = new BetterSqlite3(dbPath);
      logger.info('SQLite connection opened successfully');

      sqlite.pragma('journal_mode = WAL');
      logger.info('WAL mode enabled');

      // Benutzerdefinierter Logger für Drizzle, der NestJS-Logger verwendet
      const customLogger = {
        logQuery: (query: string, params: unknown[]) => {
          const formattedParams = params.map((p) => JSON.stringify(p)).join(', ');
          logger.debug(`Query: ${query} -- params: [${formattedParams}]`);
        },
      };

      const db = drizzle(sqlite, {
        schema: dbSchema,
        logger: toBoolean(configService.get<boolean>('DB_DEBUG_LOGGING', false))
          ? customLogger
          : false,
      });

      logger.info('Drizzle instance created successfully');
      return db;
    } catch (error) {
      logger.error(`Failed to connect to SQLite database at ${dbPath}`, error);
      if (error instanceof Error) {
        logger.error(`Error name: ${error.name}, message: ${error.message}, stack: ${error.stack}`);
      } else {
        logger.error('Caught non-Error object:', error);
      }
      throw error;
    }
  },
};
