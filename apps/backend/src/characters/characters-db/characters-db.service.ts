import { Inject, Injectable } from '@nestjs/common';
import { charactersTable, DbCharacter, NewDbCharacter } from '@pixeltales/database';
import { eq } from 'drizzle-orm';
import { PinoLogger } from 'nestjs-pino';
import { DatabaseSchema, DRIZZLE_INSTANCE } from '../../db/drizzle.provider';

/**
 * Service for managing characters in the database
 */
@Injectable()
export class CharactersDbService {
  constructor(
    @Inject(DRIZZLE_INSTANCE) private readonly db: DatabaseSchema,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CharactersDbService.name);
  }

  async create(characterData: NewDbCharacter): Promise<DbCharacter> {
    const [insertedCharacter] = await this.db
      .insert(charactersTable)
      .values(characterData)
      .returning();

    if (!insertedCharacter) {
      this.logger.error('Failed to create character');
      throw new Error('Failed to create character');
    }

    return insertedCharacter;
  }

  async findById(id: DbCharacter['id']): Promise<DbCharacter | null> {
    const [character] = await this.db
      .select()
      .from(charactersTable)
      .where(eq(charactersTable.id, id))
      .limit(1);

    return character || null;
  }

  async update(
    id: DbCharacter['id'],
    updateData: Partial<Omit<DbCharacter, 'id'>>,
  ): Promise<DbCharacter | null> {
    const [updatedCharacter] = await this.db
      .update(charactersTable)
      .set({ ...updateData, id: undefined })
      .where(eq(charactersTable.id, id))
      .returning();

    if (!updatedCharacter) {
      this.logger.error('Failed to update character');
      throw new Error('Failed to update character');
    }

    return updatedCharacter;
  }
}
