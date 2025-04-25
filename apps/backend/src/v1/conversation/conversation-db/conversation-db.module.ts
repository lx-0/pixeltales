import { Module } from '@nestjs/common';
import { DbModule } from '../../../db/db.module';
import { MessagesDbService } from './messages-db.service';

@Module({
  imports: [DbModule],
  providers: [MessagesDbService],
  exports: [MessagesDbService],
})
export class ConversationDbModule {}
