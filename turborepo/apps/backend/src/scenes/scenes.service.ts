import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateSceneConfigDTO, DBSceneConfig, SceneConfig } from '@pixeltales/contracts';
import { dbSchema } from '@pixeltales/database';
import { eq, sql } from 'drizzle-orm';
import { PinoLogger } from 'nestjs-pino';
import { DRIZZLE_INSTANCE, DrizzleSqliteDatabase } from '../db/drizzle.provider';
import { DEFAULT_SYSTEM_PROMPT } from '../scene/scene.const';

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
      this.logger.error(error, 'Error fetching proposed scenes');
      throw new InternalServerErrorException('Failed to fetch proposed scenes');
    }
  }

  async getById(id: number): Promise<DBSceneConfig | null> {
    this.logger.debug(`Fetching scene config by id: ${id}`);
    try {
      // eslint-disable-next-line @typescript-eslint/await-thenable
      const result = await this.db
        .select()
        .from(dbSchema.sceneConfigsTable)
        .where(eq(dbSchema.sceneConfigsTable.id, id))
        .get();

      if (!result) {
        this.logger.error(`Scene config ${id} not found`);
        return null;
      }

      return result;
    } catch (error) {
      this.logger.error(error, `Error fetching scene config by id ${id}`);
      throw new InternalServerErrorException('Failed to fetch scene config');
    }
  }

  async createProposal(dto: CreateSceneConfigDTO): Promise<DBSceneConfig> {
    this.logger.debug(`Creating scene config proposal: ${dto.name}`);

    // Prepare the JSON data, matching the structure expected by SceneConfigBase Pydantic model
    const configDataForJson: SceneConfig = {
      name: dto.name,
      description: dto.description,
      start_character_id: dto.start_character_id,
      characters_config: dto.characters_config, // Already validated by controller DTO
      status: 'proposed', // Set initial status explicitly in JSON
      proposer_name: dto.proposer_name,
      proposed_at: new Date().toISOString(),
      votes: 0,
      comments: [],
      system_prompt: DEFAULT_SYSTEM_PROMPT,
    };

    const newRecord: typeof dbSchema.sceneConfigsTable.$inferInsert = {
      config: configDataForJson,
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
      this.logger.error(error, 'Error creating scene proposal');
      throw new InternalServerErrorException('Failed to create scene proposal');
    }
  }

  async vote(id: number, voteValue: number): Promise<DBSceneConfig> {
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
      this.logger.error(error, `Error voting on scene config ${id}`);
      throw new InternalServerErrorException('Failed to vote on scene');
    }
  }

  async reject(id: number): Promise<void> {
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
      this.logger.error(error, `Error rejecting scene config ${id}`);
      throw new InternalServerErrorException('Failed to reject scene');
    }
  }

  async addComment(id: number, user: string, commentText: string): Promise<DBSceneConfig> {
    this.logger.debug(`Adding comment to scene config ${id} by ${user}`);
    const sceneConfig = await this.getById(id);
    if (!sceneConfig) {
      throw new NotFoundException('Scene config not found for commenting');
    }
    if (sceneConfig.status !== 'proposed') {
      throw new BadRequestException('Comments are only allowed on proposed scenes');
    }

    try {
      const newComment = {
        user: user,
        comment: commentText,
        timestamp: new Date().toISOString(),
      };
      // Add comment to the typed data object
      const updatedConfig = {
        ...sceneConfig.config,
        comments: [...sceneConfig.config.comments, newComment],
      };

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
      this.logger.error(error, `Error adding comment to scene config ${id}`);
      throw new InternalServerErrorException('Failed to add comment');
    }
  }

  async getNextConfig(configId?: number): Promise<DBSceneConfig | null> {
    if (configId) {
      this.logger.debug(`Getting specific scene config by id: ${configId}`);
      return await this.getById(configId);
    }

    this.logger.debug('Getting next scene config (highest voted or default)...');
    try {
      // 1. Find highest-voted proposed config
      // eslint-disable-next-line @typescript-eslint/await-thenable
      const highestVotedProposal = await this.db
        .select({
          id: dbSchema.sceneConfigsTable.id,
          config: dbSchema.sceneConfigsTable.config, // Need config to update status within JSON
        })
        .from(dbSchema.sceneConfigsTable)
        .where(eq(dbSchema.sceneConfigsTable.status, 'proposed'))
        .orderBy(sql`${dbSchema.sceneConfigsTable.votes} DESC`)
        .limit(1)
        .get();

      if (highestVotedProposal) {
        this.logger.info(`Found highest-voted proposal: ${highestVotedProposal.id}`);
        // Activate it (update status column and inside JSON)
        const configData = highestVotedProposal.config;
        configData.status = 'active'; // Update status in parsed object

        // eslint-disable-next-line @typescript-eslint/await-thenable
        await this.db
          .update(dbSchema.sceneConfigsTable)
          .set({
            status: 'active',
            config: configData,
          })
          .where(eq(dbSchema.sceneConfigsTable.id, highestVotedProposal.id));
        this.logger.info(`Activated scene config proposal: ${highestVotedProposal.id}`);
        // Fetch the fully populated version again after update
        return await this.getById(highestVotedProposal.id);
      }

      // 2. No proposed config found, find default (latest active, then latest overall)
      this.logger.info('No proposed configs found, looking for default (latest active/overall).');
      // eslint-disable-next-line @typescript-eslint/await-thenable
      let fallbackConfig = await this.db
        .select({ id: dbSchema.sceneConfigsTable.id })
        .from(dbSchema.sceneConfigsTable)
        .where(eq(dbSchema.sceneConfigsTable.status, 'active'))
        .orderBy(sql`${dbSchema.sceneConfigsTable.createdAt} DESC`)
        .limit(1)
        .get();

      if (fallbackConfig) {
        this.logger.info(`Found latest active config as default: ${fallbackConfig.id}`);
        return await this.getById(fallbackConfig.id);
      }

      // If no active found, get the latest overall
      // eslint-disable-next-line @typescript-eslint/await-thenable
      fallbackConfig = await this.db
        .select({ id: dbSchema.sceneConfigsTable.id })
        .from(dbSchema.sceneConfigsTable)
        .orderBy(sql`${dbSchema.sceneConfigsTable.createdAt} DESC`)
        .limit(1)
        .get();

      if (fallbackConfig) {
        this.logger.info(`Found latest overall config as default: ${fallbackConfig.id}`);
        // If this one is proposed, we might consider activating it?
        // For now, just return it as is.
        return await this.getById(fallbackConfig.id);
      }

      // 3. No config found at all
      this.logger.error('No scene configs found in the database at all.');
      return null;
    } catch (error) {
      this.logger.error(error, 'Error getting next scene config');
      throw new InternalServerErrorException('Failed to get next scene config');
    }
  }
}
