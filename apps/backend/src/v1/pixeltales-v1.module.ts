import { Module } from '@nestjs/common';
import { CharactersModule } from './characters/characters.module';
import { EventsV1Module } from './events/events.module';
import { ScenesModule } from './scenes/scenes.module';

@Module({
  imports: [EventsV1Module, ScenesModule, CharactersModule],
  controllers: [],
  providers: [],
  exports: [],
})
export class PixeltalesV1Module {}
