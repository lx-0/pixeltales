import { NestFactory } from '@nestjs/core';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(PinoLogger));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  app.get(PinoLogger).log(`🚀 Server listening on port ${port}`, 'Bootstrap');
}
bootstrap();
