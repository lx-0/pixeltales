import { Module } from '@nestjs/common';
import { CharactersDbModule } from './characters-db/characters-db.module';
import { CharactersService } from './characters.service';

@Module({
  imports: [CharactersDbModule],
  providers: [CharactersService],
  exports: [CharactersService],
})
export class CharactersModule {}
