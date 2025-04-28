import {
  Logger,
  MiddlewareConsumer,
  Module,
  NestModule,
  OnModuleInit,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_PIPE, HttpAdapterHost } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AgentConfig } from '@pixeltales/contracts';
import { AuthModule } from '@yesterday-ai/auth-backend';
import { SpritesheetModule } from '@yesterday-ai/spritesheet-backend';
import { AllExceptionsFilter } from '@yesterday-ai/utils-backend-nestjs';
import { PinoLogger } from 'nestjs-pino';
import { AgentModule } from './agent/agent.module';
import { AgentService } from './agent/agent.service';
import { AppConfigModule } from './app-config/app-config.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoreModule } from './core/core.module';
import { DbModule } from './db/db.module';
import { DebugModule } from './debug/debug.module';
import { EventsModule } from './events/events.module';
import { AppLoggerModule } from './logger/app-logger.module';
import { RequestLoggerMiddleware } from './middleware/request-logger.middleware';
import { MeModule } from './users/me.module';
import { UserModule } from './users/user.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AppLoggerModule,
    DbModule,
    AppConfigModule,
    EventsModule,
    EventEmitterModule.forRoot(),
    // ScheduleModule.forRoot(), // not used at the moment
    AuthModule,
    UsersModule,
    UserModule,
    MeModule,
    SpritesheetModule,
    // PixeltalesV1Module, // PixelTales V1
    // Feature Modules (New Agentic System)
    CoreModule,
    AgentModule,
    DebugModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useFactory: (httpAdapterHost: HttpAdapterHost, logger: PinoLogger) => {
        return new AllExceptionsFilter(httpAdapterHost, logger);
      },
      inject: [HttpAdapterHost, PinoLogger],
    },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        forbidNonWhitelisted: true,
        disableErrorMessages: false,
      }),
    },
  ],
})
export class AppModule implements NestModule, OnModuleInit {
  private readonly logger = new Logger(AppModule.name);

  constructor(private readonly agentService: AgentService) {}

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes({ path: '*all', method: RequestMethod.ALL }); // named wildcard
  }

  async onModuleInit() {
    this.logger.log('AppModule initialized, spawning Frankenstein agent...');

    // Add a small delay to ensure other modules (like DebugGateway) might initialize
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second

    const frankensteinConfig: AgentConfig = {
      personalityCore:
        'You are Frankenstein, a curious but slightly confused agent exploring your existence.',
      visualDescription: 'A tall figure assembled from various parts, wearing simple clothes.',
      llmConfig: { model: 'gpt-4o' },
      initialGoals: ['Understand my surroundings', 'Figure out who I am'],
      allowedTools: [],
    };

    try {
      const agentId = await this.agentService.spawnAgent(frankensteinConfig, 'frankenstein-01');
      this.logger.log(`Successfully spawned agent: ${agentId}`);
    } catch (error) {
      this.logger.error('Failed to spawn initial Frankenstein agent:', error);
    }
  }
}
