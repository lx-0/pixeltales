import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { CharactersDbService } from './characters-db.service';

@Module({
  imports: [DbModule],
  providers: [CharactersDbService],
  exports: [CharactersDbService],
})
export class CharactersDbModule {}
