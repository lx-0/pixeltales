import { Inject, Injectable } from '@nestjs/common';
import { DBSceneConfig, dbSchema } from '@pixeltales/database';
import { eq } from 'drizzle-orm';
import { PinoLogger } from 'nestjs-pino';
import { DRIZZLE_INSTANCE, DrizzleSqliteDatabase } from '../db/drizzle.provider';

@Injectable()
export class CharactersService {
  constructor(
    @Inject(DRIZZLE_INSTANCE) private readonly db: DrizzleSqliteDatabase,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CharactersService.name);
  }

  /**
   * Creates a character record in the database
   * @param id Character ID
   * @param name Character name
   * @param color Character color
   * @returns The created character record
   */
  async createCharacter(
    id: string,
    name: string,
    color?: string,
  ): Promise<{ id: string; name: string; color: string | null }> {
    this.logger.debug(`Creating character: ${id} (${name})`);
    try {
      // eslint-disable-next-line @typescript-eslint/await-thenable
      const character = await this.db
        .insert(dbSchema.charactersTable)
        .values({
          id,
          name,
          color: color || null,
        })
        .returning()
        .get();

      this.logger.info(`Created character: ${id}`);
      return character;
    } catch (error) {
      this.logger.error({ err: error, characterId: id }, `Failed to create character: ${id}`);
      throw error;
    }
  }

  /**
   * Checks if a character exists in the database
   * @param id Character ID
   * @returns True if the character exists, false otherwise
   */
  async characterExists(id: string): Promise<boolean> {
    try {
      // eslint-disable-next-line @typescript-eslint/await-thenable
      const character = await this.db
        .select()
        .from(dbSchema.charactersTable)
        .where(eq(dbSchema.charactersTable.id, id))
        .get();

      return !!character;
    } catch (error) {
      this.logger.error(
        { err: error, characterId: id },
        `Error checking if character exists: ${id}`,
      );
      return false;
    }
  }

  /**
   * Gets a character by ID
   * @param id Character ID
   * @returns The character or null if not found
   */
  async getCharacterById(
    id: string,
  ): Promise<{ id: string; name: string; color: string | null } | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/await-thenable
      const character = await this.db
        .select()
        .from(dbSchema.charactersTable)
        .where(eq(dbSchema.charactersTable.id, id))
        .get();

      return character || null;
    } catch (error) {
      this.logger.error({ err: error, characterId: id }, `Error getting character: ${id}`);
      return null;
    }
  }

  /**
   * Ensures all characters from the scene config exist in the characters table
   * This is necessary to avoid foreign key constraint errors when saving messages
   * @param sceneConfig The scene configuration containing characters
   */
  async ensureCharactersExistInDatabase(sceneConfig: DBSceneConfig): Promise<void> {
    this.logger.info('Ensuring all characters exist in database...');
    if (!sceneConfig?.config?.characters_config) {
      this.logger.warn('No characters config found in scene config');
      return;
    }

    try {
      const createPromises = [];

      for (const charId in sceneConfig.config.characters_config) {
        const charConfig = sceneConfig.config.characters_config[charId];
        if (!charConfig) continue;

        // Check if character already exists
        const exists = await this.characterExists(charId);

        if (!exists) {
          // Create character in database if it doesn't exist
          this.logger.info(`Creating character record for: ${charId}`);
          createPromises.push(this.createCharacter(charId, charConfig.name, charConfig.color));
        } else {
          this.logger.debug(`Character ${charId} already exists in database`);
        }
      }

      // Wait for all character creations to complete
      if (createPromises.length > 0) {
        await Promise.all(createPromises);
      }

      this.logger.info('All characters are now present in the database');
    } catch (error) {
      this.logger.error({ err: error }, 'Error ensuring characters exist in database');
      // We don't throw here to avoid stopping the scene creation process
      // The error will be caught when trying to save messages
    }
  }

  /**
   * Updates a character's properties
   * @param id Character ID
   * @param data Properties to update
   * @returns The updated character
   */
  async updateCharacter(
    id: string,
    data: { name?: string; color?: string },
  ): Promise<{ id: string; name: string; color: string | null } | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/await-thenable
      const updatedCharacter = await this.db
        .update(dbSchema.charactersTable)
        .set(data)
        .where(eq(dbSchema.charactersTable.id, id))
        .returning()
        .get();

      this.logger.info(`Updated character: ${id}`);
      return updatedCharacter;
    } catch (error) {
      this.logger.error({ err: error, characterId: id }, `Error updating character: ${id}`);
      return null;
    }
  }
}
