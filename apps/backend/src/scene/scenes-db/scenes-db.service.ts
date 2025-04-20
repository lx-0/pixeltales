import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CharacterConfigSchema,
  CharacterStateSchema,
  CommentSchema,
  DbScene,
  DbSceneConfig,
  DbSceneConfigRaw,
  DbSceneStateSnapshot,
  DbSceneStateSnapshotRaw,
  dbSchema,
  Message,
  MessageSchema,
  NewDbScene,
  NewDbSceneConfig,
  NewDbSceneConfigRaw,
  NewDbSceneStateSnapshot,
  NewDbSceneStateSnapshotRaw,
  NewMessage,
  SceneConfigCustomSchema,
  sceneConfigsTable,
  scenesTable,
  SceneStateSnapshot,
  SceneStateSnapshotCustomSchema,
  sceneStateSnapshotsTable,
  UpdateDbSceneConfig,
  UpdateDbSceneConfigRaw,
  UpdateDbSceneStateSnapshot,
  UpdateDbSceneStateSnapshotRaw,
} from '@pixeltales/database';
import { desc, eq, sql } from 'drizzle-orm';
import { PinoLogger } from 'nestjs-pino';
import { z } from 'zod';
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

  private serializeConfig(config: NewDbSceneConfig): NewDbSceneConfigRaw;
  private serializeConfig(config: UpdateDbSceneConfig): UpdateDbSceneConfigRaw;
  private serializeConfig(config: DbSceneConfig): DbSceneConfigRaw;
  private serializeConfig<T extends DbSceneConfig | NewDbSceneConfig>(config: T): T {
    return {
      ...config,
      charactersConfig: JSON.stringify(config.charactersConfig),
      comments: JSON.stringify(config.comments ?? []),
      custom: JSON.stringify(config.custom ?? {}),
    };
  }

  private parseConfigs(configs: DbSceneConfigRaw[]): DbSceneConfig[] {
    return configs.map(this.parseConfig.bind(this));
  }

  private parseConfig(config: DbSceneConfigRaw): DbSceneConfig {
    const customParseResult = SceneConfigCustomSchema.safeParse(
      JSON.parse(config.custom as unknown as string),
    );
    if (!customParseResult.success) {
      this.logger.error(
        { customParseResult },
        `Error parsing scene config ${config.id} - invalid config`,
      );
      throw new Error('Failed to parse scene config');
    }

    const charactersConfigParseResult = z
      .record(z.string(), CharacterConfigSchema)
      .safeParse(JSON.parse(config.charactersConfig));
    if (!charactersConfigParseResult.success) {
      this.logger.error(
        { charactersConfigParseResult },
        `Error parsing scene config ${config.id} - invalid characters config`,
      );
      throw new Error('Failed to parse scene config');
    }

    const commentsParseResult = z.array(CommentSchema).safeParse(JSON.parse(config.comments));
    if (!commentsParseResult.success) {
      this.logger.error(
        { commentsParseResult },
        `Error parsing scene config ${config.id} - invalid comments`,
      );
      throw new Error('Failed to parse scene config');
    }

    return {
      ...config,
      charactersConfig: charactersConfigParseResult.data,
      comments: commentsParseResult.data,
      custom: customParseResult.data,
    };
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

    const [updatedConfig] = await this.db
      .update(sceneConfigsTable)
      .set({ status })
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
    newComment: DbSceneConfig['comments'][number],
  ): Promise<DbSceneConfig> {
    const sceneConfig = await this.findConfigById(id);
    if (!sceneConfig) {
      throw new NotFoundException('Scene config not found for commenting');
    }
    if (sceneConfig.status !== 'proposed') {
      throw new BadRequestException('Comments are only allowed on proposed scenes');
    }

    const updatedComments = [...sceneConfig.comments, newComment];

    const [updatedConfig] = await this.db
      .update(sceneConfigsTable)
      .set(this.serializeConfig({ comments: updatedComments }))
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
    return {
      ...stateSnapshot,
      characters: JSON.stringify(stateSnapshot.characters),
      messages: JSON.stringify(stateSnapshot.messages),
      custom: JSON.stringify(stateSnapshot.custom),
    };
  }

  private parseStateSnapshots(stateSnapshots: DbSceneStateSnapshotRaw[]): DbSceneStateSnapshot[] {
    return stateSnapshots.map(this.parseStateSnapshot.bind(this));
  }

  private parseStateSnapshot(stateSnapshot: DbSceneStateSnapshotRaw): DbSceneStateSnapshot {
    const charactersParseResult = z
      .record(z.string(), CharacterStateSchema)
      .safeParse(JSON.parse(stateSnapshot.characters));
    if (!charactersParseResult.success) {
      this.logger.error(
        { charactersParseResult },
        `Error parsing scene state snapshot ${stateSnapshot.id} - invalid characters`,
      );
      throw new Error('Failed to parse scene state snapshot');
    }

    const messagesParseResult = z
      .array(MessageSchema)
      .safeParse(JSON.parse(stateSnapshot.messages));
    if (!messagesParseResult.success) {
      this.logger.error(
        { messagesParseResult },
        `Error parsing scene state snapshot ${stateSnapshot.id} - invalid messages`,
      );
      throw new Error('Failed to parse scene state snapshot');
    }

    const customParseResult = SceneStateSnapshotCustomSchema.safeParse(
      JSON.parse(stateSnapshot.custom),
    );
    if (!customParseResult.success) {
      this.logger.error(
        { customParseResult },
        `Error parsing scene state snapshot ${stateSnapshot.id} - invalid state`,
      );
      throw new Error('Failed to parse scene state snapshot');
    }

    return {
      ...stateSnapshot,
      characters: charactersParseResult.data,
      messages: messagesParseResult.data,
      custom: customParseResult.data,
    };
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

    const newMessage: Message = {
      ...newMessageData,
      timestamp: new Date(),
    };
    const updatedMessages: Message[] = [...stateSnapshot.messages, newMessage];

    const [updatedStateSnapshot] = await this.db
      .update(sceneStateSnapshotsTable)
      .set(this.serializeStateSnapshot({ messages: updatedMessages }))
      .where(eq(sceneStateSnapshotsTable.id, id))
      .returning();

    if (!updatedStateSnapshot) {
      this.logger.error('Failed to update state snapshot');
      throw new Error('Failed to update state snapshot');
    }

    return this.parseStateSnapshot(updatedStateSnapshot);
  }
}
