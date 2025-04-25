import { Injectable } from '@nestjs/common';
import { SceneConfig } from '@pixeltales/database';
import { PinoLogger } from 'nestjs-pino';
import { LOGGER_CONTEXT_SHORTEN } from '../../common/logger/logger.const';
import { CharactersDbService } from './characters-db/characters-db.service';

@Injectable()
export class CharactersService {
  constructor(
    private readonly charactersDb: CharactersDbService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(LOGGER_CONTEXT_SHORTEN ? '👤' : CharactersService.name);
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
      const character = await this.charactersDb.create({
        id,
        name,
        color: color || null,
      });

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
      const character = await this.charactersDb.findById(id);

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
      const character = await this.charactersDb.findById(id);

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
  async ensureCharactersExistInDatabase(sceneConfig: SceneConfig): Promise<void> {
    this.logger.info('Ensuring all characters exist in database...');
    if (!sceneConfig.charactersConfig) {
      this.logger.warn('No characters config found in scene config');
      return;
    }

    try {
      const createPromises = [];

      for (const charId in sceneConfig.charactersConfig) {
        const charConfig = sceneConfig.charactersConfig[charId];
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
      const updatedCharacter = await this.charactersDb.update(id, data);

      this.logger.info(`Updated character: ${id}`);
      return updatedCharacter;
    } catch (error) {
      this.logger.error({ err: error, characterId: id }, `Error updating character: ${id}`);
      return null;
    }
  }
}
