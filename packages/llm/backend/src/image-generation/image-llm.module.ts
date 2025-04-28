import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { IMAGE_LLM_SERVICE } from './base-image-llm.service';
import { OpenAIImageLlmService } from './openai-image-llm.service';

@Module({
  imports: [ConfigModule],
  providers: [
    // The actual implementation
    {
      provide: OpenAIImageLlmService,
      useFactory: (logger: PinoLogger, configService: ConfigService) => {
        return new OpenAIImageLlmService(logger, configService);
      },
      inject: [PinoLogger, ConfigService],
    },
    // Provider token for dependency injection
    {
      provide: IMAGE_LLM_SERVICE,
      useExisting: OpenAIImageLlmService,
    },
  ],
  exports: [
    // Export the token for flexibility
    IMAGE_LLM_SERVICE,
  ],
})
export class ImageLlmModule {}
