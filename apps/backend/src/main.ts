import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { LOGGER_CONTEXT_SHORTEN } from './common/logger/logger.const';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(PinoLogger));

  // Setze globales API-Präfix mit korrekter Wildcard-Konfiguration
  const globalPrefix = 'api/v1';
  app.setGlobalPrefix(globalPrefix, {
    exclude: ['health', 'metrics'],
  });

  // // Konfiguriere Versionierung, die modernere Path-to-Regexp Syntax verwendet
  // app.enableVersioning({
  //   type: VersioningType.URI,
  //   defaultVersion: '1',
  //   prefix: 'api/v',
  // });

  // Enable CORS for development with specific configuration
  app.enableCors({
    origin: process.env.FRONTEND_URL || true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useWebSocketAdapter(new IoAdapter(app));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  app
    .get(PinoLogger)
    .log(`Server listening on port ${port}`, LOGGER_CONTEXT_SHORTEN ? '🚀' : 'Bootstrap');
}
bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
