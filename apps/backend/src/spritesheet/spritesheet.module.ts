import { Module } from '@nestjs/common';
import { ImageLlmModule } from '../llm/image-generation/image-llm.module';
import { LlmModule } from '../llm/llm.module';
import { ImageEditorModule } from '../image-editor/image-editor.module';
import { SpritesheetController } from './spritesheet.controller';
import { SpritesheetService } from './spritesheet.service';

@Module({
  imports: [LlmModule, ImageLlmModule, ImageEditorModule],
  controllers: [SpritesheetController],
  providers: [SpritesheetService],
  exports: [SpritesheetService],
})
export class SpritesheetModule {}
