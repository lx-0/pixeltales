import { Module } from '@nestjs/common';
import { ImageEditorService } from './image-editor.service';

@Module({
  providers: [ImageEditorService],
  exports: [ImageEditorService],
})
export class ImageEditorModule {}
