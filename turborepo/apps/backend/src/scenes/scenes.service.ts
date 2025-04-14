import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateSceneConfigDTO,
  DBSceneConfig,
  DBSceneConfigPopulated,
  SceneConfig,
  SceneConfigSchema,
} from '@pixeltales/contracts';
import { dbSchema } from '@pixeltales/database';
import { randomUUID } from 'crypto';
import { eq, sql } from 'drizzle-orm';
import { PinoLogger } from 'nestjs-pino';
import { DRIZZLE_INSTANCE, DrizzleSqliteDatabase } from '../db/drizzle.provider';

@Injectable()
export class ScenesService {
  constructor(
    @Inject(DRIZZLE_INSTANCE) private readonly db: DrizzleSqliteDatabase,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ScenesService.name);
  }

  async getProposals(): Promise<DBSceneConfig[]> {
    this.logger.debug('Fetching proposed scene configs...');
    try {
      // eslint-disable-next-line @typescript-eslint/await-thenable
      const proposals = await this.db
        .select()
        .from(dbSchema.sceneConfigsTable)
        .where(eq(dbSchema.sceneConfigsTable.status, 'proposed'))
        .orderBy(dbSchema.sceneConfigsTable.createdAt) // Optional: order by creation time
        .all();
      return proposals;
    } catch (error) {
      this.logger.error('Error fetching proposed scenes', error);
      throw new InternalServerErrorException('Failed to fetch proposed scenes');
    }
  }

  async getById(id: string): Promise<DBSceneConfigPopulated | null> {
    this.logger.debug(`Fetching scene config by id: ${id}`);
    try {
      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await this.db
        .select()
        .from(dbSchema.sceneConfigsTable)
        .where(eq(dbSchema.sceneConfigsTable.id, id))
        .get(); // .get() returns one or undefined

      if (!result) {
        this.logger.error(`Scene config ${id} not found`);
        return null;
      }

      const configParseResult = SceneConfigSchema.safeParse(JSON.parse(result.config));

      if (!configParseResult.success) {
        this.logger.error(
          `Invalid config structure in DB for scene ${id}`,
          configParseResult.error.flatten(),
        );
        throw new InternalServerErrorException('Invalid scene config data in database.');
      }

      return { ...result, config: configParseResult.data };
    } catch (error) {
      this.logger.error(`Error fetching scene config by id ${id}`, error);
      throw new InternalServerErrorException('Failed to fetch scene config');
    }
  }

  async createProposal(dto: CreateSceneConfigDTO): Promise<DBSceneConfig> {
    this.logger.debug(`Creating scene config proposal: ${dto.name}`);
    const newId = randomUUID();

    // Prepare the JSON data, matching the structure expected by SceneConfigBase Pydantic model
    const configDataForJson = {
      name: dto.name,
      description: dto.description,
      start_character_id: dto.start_character_id,
      characters_config: dto.characters_config, // Already validated by controller DTO
      status: 'proposed', // Set initial status explicitly in JSON
      proposer_name: dto.proposer_name,
      proposed_at: new Date().toISOString(),
      votes: 0,
      comments: [],
    };

    const newRecord: typeof dbSchema.sceneConfigsTable.$inferInsert = {
      id: newId,
      config: JSON.stringify(configDataForJson), // Store the whole config as JSON
      status: 'proposed', // Also store status directly in DB column for easier querying
      // votes, systemPrompt, createdAt have DB defaults
    };

    try {
      // eslint-disable-next-line @typescript-eslint/await-thenable
      const inserted = await this.db
        .insert(dbSchema.sceneConfigsTable)
        .values(newRecord)
        .returning()
        .get();

      // Manually add the ID back into the config AFTER insert if needed immediately
      // (like the old SQLAlchemy event listener did). This might be better done on read.
      // inserted.config = JSON.stringify({ ...configDataForJson, id: inserted.id });
      // await this.db.update(schema.sceneConfigsTable).set({ config: inserted.config }).where(eq(schema.sceneConfigsTable.id, inserted.id));

      this.logger.info(`Created scene proposal ${inserted.id} - ${dto.name}`);
      return inserted;
    } catch (error) {
      this.logger.error('Error creating scene proposal', error);
      throw new InternalServerErrorException('Failed to create scene proposal');
    }
  }

  async vote(id: string, voteValue: number): Promise<DBSceneConfig> {
    this.logger.debug(`Voting on scene config ${id}: ${voteValue}`);
    const sceneConfig = await this.getById(id);
    if (!sceneConfig) {
      throw new NotFoundException('Scene config not found for voting');
    }
    if (sceneConfig.status !== 'proposed') {
      throw new BadRequestException('Voting is only allowed on proposed scenes');
    }

    try {
      // eslint-disable-next-line @typescript-eslint/await-thenable
      const updated = await this.db
        .update(dbSchema.sceneConfigsTable)
        .set({ votes: sql`${dbSchema.sceneConfigsTable.votes} + ${voteValue}` })
        .where(eq(dbSchema.sceneConfigsTable.id, id))
        .returning()
        .get();
      this.logger.info(`Vote updated for scene ${id}`);
      return updated;
    } catch (error) {
      this.logger.error(`Error voting on scene config ${id}`, error);
      throw new InternalServerErrorException('Failed to vote on scene');
    }
  }

  async reject(id: string): Promise<void> {
    this.logger.debug(`Rejecting scene config ${id}`);
    const sceneConfig = await this.getById(id);
    if (!sceneConfig) {
      throw new NotFoundException('Scene config not found for rejection');
    }
    if (sceneConfig.status !== 'proposed') {
      this.logger.warn(`Attempted to reject non-proposed scene: ${id}`);
      throw new BadRequestException('Only proposed scenes can be rejected');
    }
    try {
      // eslint-disable-next-line @typescript-eslint/await-thenable
      await this.db
        .update(dbSchema.sceneConfigsTable)
        .set({ status: 'rejected' })
        .where(eq(dbSchema.sceneConfigsTable.id, id));
      this.logger.info(`Scene config ${id} rejected.`);
    } catch (error) {
      this.logger.error(`Error rejecting scene config ${id}`, error);
      throw new InternalServerErrorException('Failed to reject scene');
    }
  }

  async addComment(id: string, user: string, commentText: string): Promise<DBSceneConfig> {
    this.logger.debug(`Adding comment to scene config ${id} by ${user}`);
    const sceneConfig = await this.getById(id);
    if (!sceneConfig) {
      throw new NotFoundException('Scene config not found for commenting');
    }
    if (sceneConfig.status !== 'proposed') {
      throw new BadRequestException('Comments are only allowed on proposed scenes');
    }

    try {
      // Parse and validate the JSON blob using the Zod schema
      let currentConfigData: SceneConfig;
      try {
        const validationResult = SceneConfigSchema.safeParse(sceneConfig.config);
        if (!validationResult.success) {
          this.logger.error(
            `Invalid config structure in DB for scene ${id}`,
            validationResult.error.flatten(),
          );
          throw new InternalServerErrorException('Invalid scene config data in database.');
        }
        currentConfigData = validationResult.data;
      } catch (parseError) {
        this.logger.error(`Failed to parse config for scene ${id}`, parseError);
        throw new InternalServerErrorException('Corrupted scene config data in database.');
      }

      const newComment = {
        user: user,
        comment: commentText,
        timestamp: new Date().toISOString(),
      };
      // Add comment to the typed data object
      currentConfigData.comments = [...(currentConfigData.comments ?? []), newComment];

      const updatedConfig = JSON.stringify(currentConfigData); // Stringify the validated/updated object

      // eslint-disable-next-line @typescript-eslint/await-thenable
      const updated = await this.db
        .update(dbSchema.sceneConfigsTable)
        .set({ config: updatedConfig })
        .where(eq(dbSchema.sceneConfigsTable.id, id))
        .returning()
        .get();

      this.logger.info(`Comment added successfully to scene ${id}`);
      return updated;
    } catch (error) {
      // Handle potential DB errors or re-throw other errors
      if (error instanceof HttpException) throw error; // Don't repack known HTTP errors
      this.logger.error(`Error adding comment to scene config ${id}`, error);
      throw new InternalServerErrorException('Failed to add comment');
    }
  }
}
