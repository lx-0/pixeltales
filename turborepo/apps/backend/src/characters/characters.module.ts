import { Module } from '@nestjs/common';
import { DbModule } from 'src/db/db.module';
import { CharactersService } from './characters.service';

@Module({
  imports: [DbModule],
  providers: [CharactersService],
  exports: [CharactersService],
})
export class CharactersModule {}
