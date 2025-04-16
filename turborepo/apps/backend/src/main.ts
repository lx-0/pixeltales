import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(PinoLogger));

  // Setze globales API-Präfix mit korrekter Wildcard-Konfiguration
  app.setGlobalPrefix('/api/v1', {
    exclude: ['health', 'metrics'],
  });

  // // Konfiguriere Versionierung, die modernere Path-to-Regexp Syntax verwendet
  // app.enableVersioning({
  //   type: VersioningType.URI,
  //   defaultVersion: '1',
  //   prefix: 'api/v',
  // });

  // Aktiviere CORS für Frontend-Zugriff
  app.enableCors();

  app.useWebSocketAdapter(new IoAdapter(app));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  app.get(PinoLogger).log(`🚀 Server listening on port ${port}`, 'Bootstrap');
}
bootstrap();
