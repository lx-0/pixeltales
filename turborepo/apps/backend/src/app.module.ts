import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core'; // Import APP_FILTER token
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from 'nestjs-pino';
import { IncomingMessage, ServerResponse } from 'node:http'; // Import types for customLogLevel
import { AppConfigModule } from './app-config/app-config.module'; // Import renamed module
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CharactersModule } from './characters/characters.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'; // Import the filter
import { DbModule } from './db/db.module';
import { EventsModule } from './events/events.module';
import { ScenesModule } from './scenes/scenes.module';

// Type definitions for pino serializers
interface PinoRequest extends IncomingMessage {
  id: string;
  method: string;
  url: string;
  query: Record<string, unknown>;
  params: Record<string, unknown>;
  headers: {
    [key: string]: string | string[] | undefined;
  };
  remoteAddress: string;
  remotePort: number;
}

interface PinoResponse {
  statusCode: number;
  headers?: {
    [key: string]: string | string[] | undefined;
  };
}

interface PinoError {
  type?: string;
  message?: string;
  stack?: string;
  code?: string;
}

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
            // Custom request/response serializers to reduce log verbosity
            serializers: {
              req: (req: PinoRequest) => {
                // Only log minimal request information
                return {
                  method: req.method,
                  url: req.url,
                };
              },
              res: (res: PinoResponse) => {
                // Only log minimal response information
                return {
                  statusCode: res.statusCode,
                };
              },
              err: (err: PinoError) => {
                if (!err) return;
                return {
                  message: err.message,
                  type: err.type,
                  // Only include stack in non-production
                  stack: !isProduction ? err.stack : undefined,
                };
              },
            },
            // Customize logged messages and format
            formatters: {
              level: (label) => ({ level: label }),
              bindings: () => ({}), // Remove pid and hostname bindings
              log: (object) => {
                // Clean up the log object to remove unnecessary fields
                const cleanedObject = { ...object };
                // Remove verbose fields
                delete cleanedObject.req;
                delete cleanedObject.res;
                return cleanedObject;
              },
            },
            // Completely disable automatic request logging in favor of our custom logs
            autoLogging: {
              ignore: (req) => {
                // Log 404s and 500s only at debug level, handled by exception filter
                const path = req.url || '';
                // Skip auto-logging for common static files and health checks
                return (
                  path.endsWith('.ico') ||
                  path.endsWith('.png') ||
                  path.endsWith('.js') ||
                  path.endsWith('.css') ||
                  path === '/health' ||
                  path === '/api/health'
                );
              },
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
    CharactersModule,
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
