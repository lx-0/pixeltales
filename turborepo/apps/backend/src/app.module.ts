import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core'; // Import APP_FILTER token
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from 'nestjs-pino';
import { IncomingMessage, ServerResponse } from 'node:http'; // Import types for customLogLevel
import { AppConfigModule } from './app-config/app-config.module'; // Import renamed module
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'; // Import the filter
import { DbModule } from './db/db.module';
import { EventsModule } from './events/events.module';
import { ScenesModule } from './scenes/scenes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      // Load .env file (by default)
      isGlobal: true, // Make ConfigService available globally
    }),
    // Configure Pino Logger
    LoggerModule.forRootAsync({
      imports: [ConfigModule], // Import ConfigModule to use ConfigService
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get<string>('NODE_ENV') === 'production';

        return {
          pinoHttp: {
            level: isProduction ? 'info' : 'trace', // Default level
            // Define custom levels for specific contexts (NestJS modules/services)
            customLogLevel: (
              req: IncomingMessage,
              res: ServerResponse<IncomingMessage>,
              err?: Error,
            ) => {
              const statusCode = res.statusCode ?? 500; // Default to 500 if undefined
              if (statusCode >= 400 && statusCode < 500) {
                return 'warn';
              }
              if (statusCode >= 500 || err) {
                return 'error';
              }
              // Add more context-specific levels if needed
              // Example: if (req.context === 'SensitiveModule') return 'debug';
              return 'info'; // Default for status < 400
            },
            // Use transport target for pino-pretty in development
            transport: !isProduction
              ? {
                  target: 'pino-pretty',
                  options: {
                    singleLine: true,
                    colorize: true,
                    levelFirst: true,
                    translateTime: 'SYS:HH:MM:ss.l',
                    // Custom pretty options with emojis!
                    // customPrettifiers: {
                    //   level: (logLevel: number | string): string => {
                    //     // Add types
                    //     // Ensure logLevel is treated as number for indexing
                    //     const numericLogLevel =
                    //       typeof logLevel === 'string' ? parseInt(logLevel, 10) : logLevel;
                    //     const level = {
                    //       10: 'TRACE 🔍',
                    //       20: 'DEBUG 🐛',
                    //       30: 'INFO  ℹ️',
                    //       40: 'WARN  ⚠️',
                    //       50: 'ERROR 🔥',
                    //       60: 'FATAL 💀',
                    //     }[numericLogLevel];
                    //     return level ? `${level}` : `LVL${numericLogLevel}`;
                    //   },
                    //   time: (timestamp: string | number): string => `🕰️  ${timestamp}`, // Add type
                    //   // You can add more prettifiers for hostname, pid, etc.
                    // },
                    ignore: 'pid,hostname,context', // Ignore pid and hostname for cleaner logs
                    // Define a custom message format including context
                    messageFormat: '[{context}] {msg}',
                  },
                }
              : undefined,
          },
        };
      },
    }),
    DbModule,
    AppConfigModule, // Use renamed module
    ScenesModule,
    EventsModule, // Import our database module
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Provide the filter globally using the APP_FILTER token
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    // PinoLogger wird durch LoggerModule bereitgestellt, kein expliziter Provider nötig
  ],
})
export class AppModule {}
