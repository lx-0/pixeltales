import { Inject, Injectable } from '@nestjs/common';
import {
  CharacterState,
  CharacterStateSchema,
  DBScene,
  NewDBSceneStateSnapshot,
  SceneState,
} from '@pixeltales/contracts';
import { DBSceneConfig, dbSchema } from '@pixeltales/database';
import { desc, eq } from 'drizzle-orm';
import { PinoLogger } from 'nestjs-pino';
import { DRIZZLE_INSTANCE, DrizzleSqliteDatabase } from '../../db/drizzle.provider';

@Injectable()
export class SceneStateService {
  private currentState: SceneState | null = null;

  constructor(
    @Inject(DRIZZLE_INSTANCE) private readonly db: DrizzleSqliteDatabase,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SceneStateService.name);
  }

  // --- State Access ---

  getCurrentState(): SceneState | null {
    return this.currentState;
  }

  setCurrentState(state: SceneState | null): void {
    this.currentState = state;
  }

  getCharacterState(characterId: string): CharacterState | undefined {
    return this.currentState?.characters[characterId];
  }

  updateCharacterState(characterId: string, updates: Partial<CharacterState>): void {
    if (!this.currentState || !this.currentState.characters[characterId]) {
      this.logger.warn(`Character ${characterId} not found in active state for update.`);
      return;
    }
    // Ensure immutability if state is shared or used elsewhere extensively
    this.currentState.characters[characterId] = {
      ...this.currentState.characters[characterId],
      ...updates,
    };
    // Note: Emitting state updates should likely happen after calling this,
    // orchestrated by SceneManager or another service.
  }

  updateState(updates: Partial<SceneState>): void {
    if (!this.currentState) {
      this.logger.warn('Cannot update state: No current state exists.');
      return;
    }
    this.currentState = { ...this.currentState, ...updates };
    // Note: Emitting state updates should likely happen after calling this.
  }

  // --- Initialization ---

  initializeStateFromConfig(
    scene: DBScene,
    sceneConfig: DBSceneConfig,
    initialVisitorCount: number,
  ): SceneState {
    this.logger.info(`Initializing scene state from config ${scene.sceneConfigId}`);
    const characters: Record<string, CharacterState> = {};

    for (const charId in sceneConfig.config.characters_config) {
      const config = sceneConfig.config.characters_config[charId];
      if (!config) {
        this.logger.error(`Character config for ${charId} not found in config`);
        continue;
      }
      const characterStateParseResult = CharacterStateSchema.safeParse({
        id: charId,
        name: config.name,
        color: config.color,
        role: config.role,
        visual: config.visual,
        llm_config: config.llm_config,
        position: config.initial_position,
        direction: config.initial_direction,
        current_mood: config.initial_mood ?? 'neutral',
        action: config.initial_action ?? 'idle',
        action_started_at: Date.now(),
        end_conversation_requested: false,
      });

      if (characterStateParseResult.success) {
        characters[charId] = characterStateParseResult.data;
      } else {
        this.logger.error(
          `Failed to parse initial state for character ${charId}`,
          characterStateParseResult.error.flatten(),
        );
        // Potentially throw an error here?
      }
    }

    const initialState: SceneState = {
      scene_id: scene.id,
      scene_config_id: scene.sceneConfigId,
      characters: characters,
      messages: [],
      started_at: Date.now(),
      conversation_active: initialVisitorCount > 0,
      conversation_ended: false,
      ended_at: null,
      visitor_count: initialVisitorCount,
    };

    this.currentState = initialState; // Set the internal state
    this.logger.info('Scene state initialized successfully from config.');
    return initialState;
  }

  // --- Snapshot Management ---

  async loadLatestSnapshotForScene(sceneId: number): Promise<SceneState | null> {
    this.logger.debug(`Loading latest snapshot for scene ${sceneId}...`);
    // eslint-disable-next-line @typescript-eslint/await-thenable
    const latestSnapshot = await this.db
      .select()
      .from(dbSchema.sceneStateSnapshotsTable)
      .where(eq(dbSchema.sceneStateSnapshotsTable.sceneId, sceneId))
      .orderBy(desc(dbSchema.sceneStateSnapshotsTable.timestamp))
      .limit(1)
      .get();

    return latestSnapshot?.state ?? null;
  }

  async saveSnapshot(sceneId: number): Promise<void> {
    if (!this.currentState) {
      this.logger.warn('Cannot save snapshot: No current state exists.');
      return;
    }
    if (this.currentState.scene_id !== sceneId) {
      this.logger.error(
        `Cannot save snapshot: Current state scene ID (${this.currentState.scene_id}) does not match provided scene ID (${sceneId}).`,
      );
      return;
    }

    this.logger.debug(`Saving snapshot for scene ${sceneId}...`);
    const newStateSnapshot: NewDBSceneStateSnapshot = {
      sceneId: sceneId,
      state: this.currentState,
      configId: this.currentState.scene_config_id,
      // timestamp is defaulted by DB
    };
    try {
      // eslint-disable-next-line @typescript-eslint/await-thenable
      await this.db.insert(dbSchema.sceneStateSnapshotsTable).values(newStateSnapshot);
      this.logger.info(`Snapshot saved for scene ${sceneId}.`);
    } catch (error) {
      this.logger.error(`Failed to save state snapshot for scene ${sceneId}`, error);
      // Potentially re-throw or handle differently
    }
  }
}
