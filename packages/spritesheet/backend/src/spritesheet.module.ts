import { Module } from '@nestjs/common';
import { ImageEditorModule } from '@yesterday-ai/images-backend';
import { ImageLlmModule, LlmModule } from '@yesterday-ai/llm-backend';
import { SpritesheetController } from './spritesheet.controller';
import { SpritesheetService } from './spritesheet.service';

@Module({
  imports: [LlmModule, ImageLlmModule, ImageEditorModule],
  controllers: [SpritesheetController],
  providers: [SpritesheetService],
  exports: [SpritesheetService],
})
export class SpritesheetModule {}
