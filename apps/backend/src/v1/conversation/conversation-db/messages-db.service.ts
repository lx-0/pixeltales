import { Inject, Injectable } from '@nestjs/common';
import { DbMessage, messagesTable, NewDbMessage } from '@pixeltales/database';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import { PinoLogger } from 'nestjs-pino';
import { DatabaseSchema, DRIZZLE_INSTANCE } from '../../../db/drizzle.provider';

/**
 * Service for managing messages in the database
 */
@Injectable()
export class MessagesDbService {
  constructor(
    @Inject(DRIZZLE_INSTANCE) private readonly db: DatabaseSchema,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MessagesDbService.name);
  }

  async create(messageData: Omit<NewDbMessage, 'id'>): Promise<DbMessage> {
    const [insertedMessage] = await this.db
      .insert(messagesTable)
      .values({ ...messageData, id: randomUUID() })
      .returning();

    if (!insertedMessage) {
      this.logger.error('Failed to create message');
      throw new Error('Failed to create message');
    }

    return insertedMessage;
  }

  async findById(id: DbMessage['id']): Promise<DbMessage | null> {
    const [message] = await this.db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.id, id))
      .limit(1);

    return message || null;
  }

  async update(
    id: DbMessage['id'],
    updateData: Partial<Omit<DbMessage, 'id'>>,
  ): Promise<DbMessage | null> {
    const [updatedMessage] = await this.db
      .update(messagesTable)
      .set({ ...updateData, id: undefined })
      .where(eq(messagesTable.id, id))
      .returning();

    if (!updatedMessage) {
      this.logger.error('Failed to update message');
      throw new Error('Failed to update message');
    }

    return updatedMessage;
  }
}
