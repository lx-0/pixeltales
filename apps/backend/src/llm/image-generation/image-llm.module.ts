import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenAIImageLlmService } from './openai-image-llm.service';
import { IMAGE_LLM_SERVICE } from './base-image-llm.service';

@Module({
  imports: [ConfigModule],
  providers: [
    // The actual implementation
    OpenAIImageLlmService,

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
