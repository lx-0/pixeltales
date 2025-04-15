import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { DRIZZLE_INSTANCE, DrizzleSqliteDatabase } from './db/drizzle.provider';

@Injectable()
export class AppService {
  constructor(
    @Inject(DRIZZLE_INSTANCE) private readonly db: DrizzleSqliteDatabase,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AppService.name);
    this.logger.info('AppService initialized 🚀');

    if (this.db) {
      this.logger.info('Drizzle instance successfully injected! ✅');
    } else {
      this.logger.error('Drizzle instance injection FAILED! ❌');
    }
  }

  getHello(): string {
    this.logger.debug('Generating hello message...');
    const dbType = this.db ? 'SQLite (via Drizzle)' : 'undefined';
    return `Hello World! 👋 Connected DB: ${dbType}`;
  }

  getHealth() {
    this.logger.debug('Health check requested');
    const dbConnected = !!this.db;

    return {
      status: 'healthy',
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
      database: {
        connected: dbConnected,
        type: 'SQLite (via Drizzle)',
      },
    };
  }
}
