import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  DbScene,
  DbSceneConfig,
  DbSceneConfigRaw,
  DbSceneStateSnapshot,
  DbSceneStateSnapshotRaw,
  dbSchema,
  Message,
  NewDbScene,
  NewDbSceneConfig,
  NewDbSceneConfigRaw,
  NewDbSceneStateSnapshot,
  NewDbSceneStateSnapshotRaw,
  NewMessage,
  SceneConfig,
  SceneConfigConfigSchema,
  sceneConfigsTable,
  scenesTable,
  SceneStateSnapshot,
  sceneStateSnapshotsTable,
  SceneStateSnapshotState,
  SceneStateSnapshotStateSchema,
  UpdateDbSceneConfig,
  UpdateDbSceneConfigRaw,
  UpdateDbSceneStateSnapshot,
  UpdateDbSceneStateSnapshotRaw,
} from '@pixeltales/database';
import { desc, eq, sql } from 'drizzle-orm';
import { PinoLogger } from 'nestjs-pino';
import { DatabaseSchema, DRIZZLE_INSTANCE } from '../../db/drizzle.provider';

/**
 * Service for managing scenes in the database
 */
@Injectable()
export class ScenesDbService {
  constructor(
    @Inject(DRIZZLE_INSTANCE) private readonly db: DatabaseSchema,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ScenesDbService.name);
  }

  // --- Scenes ---

  async create(sceneData: NewDbScene): Promise<DbScene> {
    const [insertedScene] = await this.db.insert(scenesTable).values(sceneData).returning();

    if (!insertedScene) {
      this.logger.error('Failed to create scene');
      throw new Error('Failed to create scene');
    }

    return insertedScene;
  }

  async findById(id: DbScene['id']): Promise<DbScene | null> {
    const [scene] = await this.db.select().from(scenesTable).where(eq(scenesTable.id, id)).limit(1);

    return scene || null;
  }

  async findLatest(): Promise<DbScene | null> {
    const [scene] = await this.db
      .select()
      .from(scenesTable)
      .orderBy(desc(scenesTable.createdAt))
      .limit(1);

    return scene || null;
  }

  async update(id: DbScene['id'], updateData: Partial<Omit<DbScene, 'id'>>): Promise<DbScene> {
    const [updatedScene] = await this.db
      .update(scenesTable)
      .set({ ...updateData, id: undefined })
      .where(eq(scenesTable.id, id))
      .returning();

    if (!updatedScene) {
      this.logger.error('Failed to update scene');
      throw new Error('Failed to update scene');
    }

    return updatedScene;
  }

  // --- Scene Configs ---

  private serializeConfigs(configs: NewDbSceneConfig[]): NewDbSceneConfigRaw[];
  private serializeConfigs(configs: UpdateDbSceneConfig[]): UpdateDbSceneConfigRaw[];
  private serializeConfigs(configs: DbSceneConfig[]): DbSceneConfigRaw[];
  private serializeConfigs(
    configs: DbSceneConfig[] | NewDbSceneConfig[],
  ): DbSceneConfigRaw[] | NewDbSceneConfigRaw[] {
    return configs.map((c) => this.serializeConfig(c));
  }

  private serializeConfig(configs: NewDbSceneConfig): NewDbSceneConfigRaw;
  private serializeConfig(configs: UpdateDbSceneConfig): UpdateDbSceneConfigRaw;
  private serializeConfig(configs: DbSceneConfig): DbSceneConfigRaw;
  private serializeConfig<T extends DbSceneConfig | NewDbSceneConfig>(config: T): T {
    return { ...config, config: JSON.stringify(config.config) };
  }

  private parseConfigs(configs: DbSceneConfigRaw[]): DbSceneConfig[] {
    return configs.map(this.parseConfig.bind(this));
  }

  private parseConfig(config: DbSceneConfigRaw): DbSceneConfig {
    const configParseResult = SceneConfigConfigSchema.safeParse(
      JSON.parse(config.config as unknown as string),
    );

    if (!configParseResult.success) {
      this.logger.error(
        { configParseResult },
        `Error parsing scene config ${config.id} - invalid config`,
      );
      throw new Error('Failed to parse scene config');
    }

    return { ...config, config: configParseResult.data };
  }

  public convertToSceneConfig(config: DbSceneConfig): SceneConfig {
    return config;
  }

  async createConfig(configData: NewDbSceneConfig): Promise<DbSceneConfig> {
    const [insertedConfig] = await this.db
      .insert(sceneConfigsTable)
      .values(this.serializeConfig(configData))
      .returning();

    if (!insertedConfig) {
      this.logger.error('Failed to create scene config');
      throw new Error('Failed to create scene config');
    }

    return this.parseConfig(insertedConfig);
  }

  async findConfigById(id: DbSceneConfig['id']): Promise<DbSceneConfig | null> {
    const [config] = await this.db
      .select()
      .from(sceneConfigsTable)
      .where(eq(sceneConfigsTable.id, id))
      .limit(1);

    if (!config) {
      return null;
    }

    return this.parseConfig(config);
  }

  async findProposals(): Promise<DbSceneConfig[]> {
    // eslint-disable-next-line @typescript-eslint/await-thenable
    const proposals = await this.db
      .select()
      .from(sceneConfigsTable)
      .where(eq(sceneConfigsTable.status, 'proposed'))
      .orderBy(sceneConfigsTable.createdAt) // Optional: order by creation time
      .all();

    return this.parseConfigs(proposals);
  }

  async findHighestVotedProposal(): Promise<DbSceneConfig | null> {
    // eslint-disable-next-line @typescript-eslint/await-thenable
    const [highestVotedProposal] = await this.db
      .select()
      .from(sceneConfigsTable)
      .where(eq(sceneConfigsTable.status, 'proposed'))
      .orderBy(desc(sceneConfigsTable.votes))
      .limit(1);

    return highestVotedProposal ? this.parseConfig(highestVotedProposal) : null;
  }

  async findLatestActiveConfig(): Promise<DbSceneConfig | null> {
    const [latestActiveConfig] = await this.db
      .select()
      .from(sceneConfigsTable)
      .where(eq(sceneConfigsTable.status, 'active'))
      .orderBy(sql`${dbSchema.sceneConfigsTable.createdAt} DESC`)
      .limit(1);

    return latestActiveConfig ? this.parseConfig(latestActiveConfig) : null;
  }

  async findLatestConfig(): Promise<DbSceneConfig | null> {
    const [latestConfig] = await this.db
      .select()
      .from(sceneConfigsTable)
      .orderBy(sql`${dbSchema.sceneConfigsTable.createdAt} DESC`)
      .limit(1);

    return latestConfig ? this.parseConfig(latestConfig) : null;
  }

  async updateConfig(
    id: DbSceneConfig['id'],
    updateData: UpdateDbSceneConfig,
  ): Promise<DbSceneConfig> {
    const [updatedConfig] = await this.db
      .update(sceneConfigsTable)
      .set(this.serializeConfig(updateData))
      .where(eq(sceneConfigsTable.id, id))
      .returning();

    if (!updatedConfig) {
      this.logger.error('Failed to update scene config');
      throw new Error('Failed to update scene config');
    }

    return this.parseConfig(updatedConfig);
  }

  async updateConfigVotes(
    id: DbSceneConfig['id'],
    voteValue: DbSceneConfig['votes'],
  ): Promise<DbSceneConfig> {
    const [updatedConfig] = await this.db
      .update(sceneConfigsTable)
      .set({ votes: sql`${dbSchema.sceneConfigsTable.votes} + ${voteValue}` })
      .where(eq(sceneConfigsTable.id, id))
      .returning();

    if (!updatedConfig) {
      this.logger.error('Failed to update scene config');
      throw new Error('Failed to update scene config');
    }

    return this.parseConfig(updatedConfig);
  }

  async updateConfigStatus(
    id: DbSceneConfig['id'],
    status: DbSceneConfig['status'],
  ): Promise<DbSceneConfig> {
    const sceneConfig = await this.findConfigById(id);
    if (!sceneConfig) {
      throw new NotFoundException('Scene config not found for commenting');
    }

    const updatedConfigConfig = {
      ...sceneConfig.config,
      status,
    };

    const [updatedConfig] = await this.db
      .update(sceneConfigsTable)
      .set(this.serializeConfig({ status, config: updatedConfigConfig }))
      .where(eq(sceneConfigsTable.id, id))
      .returning();

    if (!updatedConfig) {
      this.logger.error('Failed to update scene config status');
      throw new Error('Failed to update scene config status');
    }

    return this.parseConfig(updatedConfig);
  }

  async addConfigComments(
    id: DbSceneConfig['id'],
    newComment: DbSceneConfig['config']['comments'][number],
  ): Promise<DbSceneConfig> {
    const sceneConfig = await this.findConfigById(id);
    if (!sceneConfig) {
      throw new NotFoundException('Scene config not found for commenting');
    }
    if (sceneConfig.status !== 'proposed') {
      throw new BadRequestException('Comments are only allowed on proposed scenes');
    }

    const updatedConfigConfig = {
      ...sceneConfig.config,
      comments: [...sceneConfig.config.comments, newComment],
    };

    const [updatedConfig] = await this.db
      .update(sceneConfigsTable)
      .set(this.serializeConfig({ config: updatedConfigConfig }))
      .where(eq(sceneConfigsTable.id, id))
      .returning();

    if (!updatedConfig) {
      this.logger.error('Failed to update scene config comments');
      throw new Error('Failed to update scene config comments');
    }

    return this.parseConfig(updatedConfig);
  }

  // --- Scene State Snapshots ---

  private serializeStateSnapshots(
    stateSnapshots: NewDbSceneStateSnapshot[],
  ): NewDbSceneStateSnapshotRaw[];
  private serializeStateSnapshots(
    stateSnapshots: UpdateDbSceneStateSnapshot[],
  ): UpdateDbSceneStateSnapshotRaw[];
  private serializeStateSnapshots(
    stateSnapshots: DbSceneStateSnapshot[],
  ): DbSceneStateSnapshotRaw[];
  private serializeStateSnapshots(
    stateSnapshots: DbSceneStateSnapshot[] | NewDbSceneStateSnapshot[],
  ): DbSceneStateSnapshotRaw[] | NewDbSceneStateSnapshotRaw[] {
    return stateSnapshots.map((s) => this.serializeStateSnapshot(s));
  }

  private serializeStateSnapshot(
    stateSnapshot: NewDbSceneStateSnapshot,
  ): NewDbSceneStateSnapshotRaw;
  private serializeStateSnapshot(
    stateSnapshot: UpdateDbSceneStateSnapshot,
  ): UpdateDbSceneStateSnapshotRaw;
  private serializeStateSnapshot(stateSnapshot: DbSceneStateSnapshot): DbSceneStateSnapshotRaw;
  private serializeStateSnapshot<T extends DbSceneStateSnapshot | NewDbSceneStateSnapshot>(
    stateSnapshot: T,
  ): T {
    return { ...stateSnapshot, state: JSON.stringify(stateSnapshot.state) };
  }

  private parseStateSnapshots(stateSnapshots: DbSceneStateSnapshotRaw[]): DbSceneStateSnapshot[] {
    return stateSnapshots.map(this.parseStateSnapshot.bind(this));
  }

  private parseStateSnapshot(stateSnapshot: DbSceneStateSnapshotRaw): DbSceneStateSnapshot {
    const stateSnapshotParseResult = SceneStateSnapshotStateSchema.safeParse(
      JSON.parse(stateSnapshot.state as unknown as string),
    );

    if (!stateSnapshotParseResult.success) {
      this.logger.error(
        { stateSnapshotParseResult },
        `Error parsing scene state snapshot ${stateSnapshot.id} - invalid state`,
      );
      throw new Error('Failed to parse scene state snapshot');
    }

    return { ...stateSnapshot, state: stateSnapshotParseResult.data };
  }

  public convertToSceneStateSnapshot(config: DbSceneStateSnapshot): SceneStateSnapshot {
    return config;
  }

  async createStateSnapshot(
    sceneStateSnapshotData: NewDbSceneStateSnapshot,
  ): Promise<DbSceneStateSnapshot> {
    const [insertedStateSnapshot] = await this.db
      .insert(sceneStateSnapshotsTable)
      .values(this.serializeStateSnapshot(sceneStateSnapshotData))
      .returning();

    if (!insertedStateSnapshot) {
      this.logger.error('Failed to create state snapshot');
      throw new Error('Failed to create state snapshot');
    }

    return this.parseStateSnapshot(insertedStateSnapshot);
  }

  async findStateSnapshotById(
    id: DbSceneStateSnapshot['id'],
  ): Promise<DbSceneStateSnapshot | null> {
    const [stateSnapshot] = await this.db
      .select()
      .from(sceneStateSnapshotsTable)
      .where(eq(sceneStateSnapshotsTable.id, id))
      .limit(1);

    return stateSnapshot ? this.parseStateSnapshot(stateSnapshot) : null;
  }

  async findLatestState(sceneId: DbScene['id']): Promise<DbSceneStateSnapshot | null> {
    // eslint-disable-next-line @typescript-eslint/await-thenable
    const latestStateSnapshot = await this.db
      .select()
      .from(sceneStateSnapshotsTable)
      .where(eq(sceneStateSnapshotsTable.sceneId, sceneId))
      .orderBy(desc(sceneStateSnapshotsTable.timestamp))
      .limit(1)
      .get();

    return latestStateSnapshot ? this.parseStateSnapshot(latestStateSnapshot) : null;
  }

  async addMessageToState(
    id: DbSceneStateSnapshot['id'],
    newMessageData: NewMessage,
  ): Promise<DbSceneStateSnapshot> {
    const stateSnapshot = await this.findStateSnapshotById(id);

    if (!stateSnapshot) {
      this.logger.warn('Cannot add message: No current state exists.');
      throw new Error('Cannot add message: No current state exists.');
    }

    const now = new Date();
    const newMessage: Message = {
      ...newMessageData,
      timestamp: now.toISOString(),
      unix_timestamp: now.getTime(),
    };
    const updatedState: SceneStateSnapshotState = {
      ...stateSnapshot.state,
      messages: [...stateSnapshot.state.messages, newMessage],
    };

    const [updatedStateSnapshot] = await this.db
      .update(sceneStateSnapshotsTable)
      .set(this.serializeStateSnapshot({ state: updatedState }))
      .where(eq(sceneStateSnapshotsTable.id, id))
      .returning();

    if (!updatedStateSnapshot) {
      this.logger.error('Failed to update state snapshot');
      throw new Error('Failed to update state snapshot');
    }

    return this.parseStateSnapshot(updatedStateSnapshot);
  }
}
