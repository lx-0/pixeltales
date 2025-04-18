import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateSceneConfigDTO, SceneConfig } from '@pixeltales/contracts';
import { NewDbSceneConfig, NewSceneConfig, SceneConfigConfig } from '@pixeltales/database';
import { PinoLogger } from 'nestjs-pino';
import { DEFAULT_SCENE_CONFIG, DEFAULT_SYSTEM_PROMPT } from '../scene/default-scene.const';
import { ScenesDbService } from '../scene/scenes-db/scenes-db.service';

@Injectable()
export class ScenesService {
  constructor(
    private readonly scenesDb: ScenesDbService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ScenesService.name);
  }

  async getProposals(): Promise<SceneConfig[]> {
    this.logger.debug('Fetching proposed scene configs...');
    try {
      return await this.scenesDb.findProposals();
    } catch (error) {
      this.logger.error(error, 'Error fetching proposed scenes');
      throw new InternalServerErrorException('Failed to fetch proposed scenes');
    }
  }

  async getById(id: number): Promise<SceneConfig | null> {
    this.logger.debug(`Fetching scene config by id: ${id}`);
    try {
      const result = await this.scenesDb.findConfigById(id);

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

  async createProposal(dto: CreateSceneConfigDTO): Promise<SceneConfig> {
    this.logger.debug(`Creating scene config proposal: ${dto.name}`);

    // Prepare the JSON data, matching the structure expected by SceneConfigBase Pydantic model
    const configDataForJson: SceneConfigConfig = {
      id: 0, // TODO: Remove this once we have a proper ID
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

    const newRecord: NewDbSceneConfig = {
      config: configDataForJson,
      status: 'proposed', // Also store status directly in DB column for easier querying
      // votes, systemPrompt, createdAt have DB defaults
    };

    try {
      const inserted = await this.scenesDb.createConfig(newRecord);

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

  async vote(id: number, voteValue: number): Promise<SceneConfig> {
    this.logger.debug(`Voting on scene config ${id}: ${voteValue}`);
    const sceneConfig = await this.getById(id);
    if (!sceneConfig) {
      throw new NotFoundException('Scene config not found for voting');
    }
    if (sceneConfig.status !== 'proposed') {
      throw new BadRequestException('Voting is only allowed on proposed scenes');
    }

    try {
      const updated = await this.scenesDb.updateConfigVotes(id, voteValue);
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
      const updated = await this.scenesDb.updateConfigStatus(id, 'rejected');
      this.logger.info(`Scene config ${id} rejected.`);
    } catch (error) {
      this.logger.error(error, `Error rejecting scene config ${id}`);
      throw new InternalServerErrorException('Failed to reject scene');
    }
  }

  async addComment(id: number, user: string, commentText: string): Promise<SceneConfig> {
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

      const updated = await this.scenesDb.addConfigComments(id, newComment);

      this.logger.info(`Comment added successfully to scene ${id}`);
      return updated;
    } catch (error) {
      // Handle potential DB errors or re-throw other errors
      if (error instanceof HttpException) throw error; // Don't repack known HTTP errors
      this.logger.error(error, `Error adding comment to scene config ${id}`);
      throw new InternalServerErrorException('Failed to add comment');
    }
  }

  async getNextConfig(configId?: number): Promise<SceneConfig | null> {
    if (configId) {
      this.logger.debug(`Getting specific scene config by id: ${configId}`);
      return await this.getById(configId);
    }

    this.logger.debug('Getting next scene config (highest voted or default)...');
    try {
      // 1. Find highest-voted proposed config
      const highestVotedProposal = await this.scenesDb.findHighestVotedProposal();
      if (highestVotedProposal) {
        this.logger.info(`Found highest-voted proposal: ${highestVotedProposal.id}`);
        await this.scenesDb.updateConfigStatus(highestVotedProposal.id, 'active');

        this.logger.info(`Activated scene config proposal: ${highestVotedProposal.id}`);
        // Fetch the fully populated version again after update
        return this.scenesDb.convertToSceneConfig(highestVotedProposal);
      }

      // 2. No proposed config found, find default (latest active, then latest overall)
      this.logger.info('No proposed configs found, looking for default (latest active/overall).');
      const latestActiveConfig = await this.scenesDb.findLatestActiveConfig();
      if (latestActiveConfig) {
        this.logger.info(`Found latest active config as default: ${latestActiveConfig.id}`);
        return this.scenesDb.convertToSceneConfig(latestActiveConfig);
      }

      // If no active found, get the latest overall
      const latestOverallConfig = await this.scenesDb.findLatestConfig();
      if (latestOverallConfig) {
        this.logger.info(`Found latest overall config as default: ${latestOverallConfig.id}`);
        // If this one is proposed, we might consider activating it?
        // For now, just return it as is.
        return this.scenesDb.convertToSceneConfig(latestOverallConfig);
      }

      // 3. No config found at all - use default config
      return await this.getDefaultConfig();
    } catch (error) {
      this.logger.error(error, 'Error getting next scene config');
      throw new InternalServerErrorException('Failed to get next scene config');
    }
  }

  private async getDefaultConfig(): Promise<SceneConfig> {
    this.logger.warn('No scene configs found in database, using hard-coded default config');

    // Create a default record in the database with the default config
    const defaultRecord: NewSceneConfig = {
      config: DEFAULT_SCENE_CONFIG,
      status: 'active',
      systemPrompt: DEFAULT_SCENE_CONFIG.system_prompt,
    };

    try {
      const insertedDefault = await this.scenesDb.createConfig(defaultRecord);

      this.logger.info(`Created default scene config with ID: ${insertedDefault.id}`);
      return insertedDefault;
    } catch (err) {
      this.logger.error({ err }, 'Failed to save default config to database');

      // Return a synthetic record not saved to DB as last resort
      return {
        id: 0,
        config: DEFAULT_SCENE_CONFIG,
        status: 'active',
        votes: 0,
        systemPrompt: DEFAULT_SCENE_CONFIG.system_prompt,
        createdAt: new Date(),
      };
    }
  }
}
