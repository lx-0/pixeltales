import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateSceneConfigDTO, SceneConfig } from '@pixeltales/contracts';
import { NewDbSceneConfig, NewSceneConfig, Scene, SceneConfigSchema } from '@pixeltales/database';
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

  async getConfigById(id: SceneConfig['id']): Promise<SceneConfig | null> {
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

    const newSceneConfig: NewSceneConfig = {
      ...dto,
      status: 'proposed', // Set initial status explicitly in JSON
      proposedAt: new Date(),
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
    };
    const newDbRecord: NewDbSceneConfig = SceneConfigSchema.parse(newSceneConfig);

    try {
      const inserted = await this.scenesDb.createConfig(newDbRecord);

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

  async vote(id: SceneConfig['id'], voteValue: number): Promise<SceneConfig> {
    this.logger.debug(`Voting on scene config ${id}: ${voteValue}`);
    const sceneConfig = await this.getConfigById(id);
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

  async reject(id: SceneConfig['id']): Promise<void> {
    this.logger.debug(`Rejecting scene config ${id}`);
    const sceneConfig = await this.getConfigById(id);
    if (!sceneConfig) {
      throw new NotFoundException('Scene config not found for rejection');
    }
    if (sceneConfig.status !== 'proposed') {
      this.logger.warn(`Attempted to reject non-proposed scene: ${id}`);
      throw new BadRequestException('Only proposed scenes can be rejected');
    }
    try {
      const _updated = await this.scenesDb.updateConfigStatus(id, 'rejected');
      this.logger.info(`Scene config ${id} rejected.`);
    } catch (error) {
      this.logger.error(error, `Error rejecting scene config ${id}`);
      throw new InternalServerErrorException('Failed to reject scene');
    }
  }

  async addComment(id: SceneConfig['id'], user: string, commentText: string): Promise<SceneConfig> {
    this.logger.debug(`Adding comment to scene config ${id} by ${user}`);
    const sceneConfig = await this.getConfigById(id);
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

  async createSceneFromConfig(config: SceneConfig): Promise<Scene> {
    this.logger.debug(`Activating proposed scene config ${config.id}`);

    if (config.status === 'proposed') {
      const _updatedConfig = await this.scenesDb.updateConfigStatus(config.id, 'active');
    }

    const newScene = await this.scenesDb.create({
      configId: config.id,
    });
    this.logger.info(`Created new scene record: ${newScene.id}`);

    return newScene;
  }

  async getNextConfig(configId?: SceneConfig['id']): Promise<SceneConfig | null> {
    if (configId) {
      this.logger.debug(`Getting specific scene config by id: ${configId}`);
      return await this.getConfigById(configId);
    }

    this.logger.debug('Getting next scene config (highest voted or default)...');
    try {
      // 1. Find highest-voted proposed config
      const highestVotedProposal = await this.scenesDb.findHighestVotedProposal();
      if (highestVotedProposal) {
        this.logger.info(`Found highest-voted proposal: ${highestVotedProposal.id}`);
        return highestVotedProposal;
      }

      // 2. No proposed config found, find default (latest active, then latest overall)
      this.logger.info('No proposed configs found, looking for default (latest active/overall).');
      const latestActiveConfig = await this.scenesDb.findLatestActiveConfig();
      if (latestActiveConfig) {
        this.logger.info(`Found latest active config as default: ${latestActiveConfig.id}`);
        return latestActiveConfig;
      }

      // If no active found, get the latest overall
      const latestOverallConfig = await this.scenesDb.findLatestConfig();
      if (latestOverallConfig) {
        this.logger.info(`Found latest overall config as default: ${latestOverallConfig.id}`);
        // If this one is proposed, we might consider activating it?
        // For now, just return it as is.
        return latestOverallConfig;
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
      ...DEFAULT_SCENE_CONFIG,
      status: 'active',
    };

    try {
      const insertedDefault = await this.scenesDb.createConfig(defaultRecord);

      this.logger.info(`Created default scene config with ID: ${insertedDefault.id}`);
      return insertedDefault;
    } catch (err) {
      this.logger.error({ err }, 'Failed to save default config to database');
      throw new InternalServerErrorException('Failed to save default config to database');
    }
  }
}
