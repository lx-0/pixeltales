import { Injectable } from '@nestjs/common';
import {
  CharacterState,
  CharacterStateSchema,
  Message,
  NewSceneStateSnapshot,
  Scene,
  SceneConfig,
  SceneStateSnapshotState,
} from '@pixeltales/contracts';
import { PinoLogger } from 'nestjs-pino';
import { ScenesDbService } from '../scenes-db/scenes-db.service';

@Injectable()
export class SceneStateService {
  private currentStateId: number | null = null;
  private currentState: SceneStateSnapshotState | null = null;
  private currentScene: Scene | null = null;
  private currentSceneConfig: SceneConfig | null = null;

  constructor(
    private readonly scenesDb: ScenesDbService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SceneStateService.name);
  }

  // --- State Access ---

  public isActive(): boolean {
    return this.currentStateId !== null;
  }

  public isLoaded(): boolean {
    return (
      this.currentState !== null && this.currentScene !== null && this.currentSceneConfig !== null
    );
  }

  public getCurrentState(): SceneStateSnapshotState | null {
    return this.currentState;
  }

  public getCurrentScene(): Scene | null {
    return this.currentScene;
  }

  public getCurrentSceneConfig(): SceneConfig | null {
    return this.currentSceneConfig;
  }

  public setCurrentScene(scene: Scene, config: SceneConfig): void {
    this.currentScene = scene;
    this.currentSceneConfig = config;
  }

  setCurrentState(id: number, state: SceneStateSnapshotState): void {
    this.currentStateId = id;
    this.currentState = state;
  }

  resetCurrentState(): void {
    this.currentStateId = null;
    this.currentState = null;
  }

  resetCurrentScene(): void {
    this.resetCurrentState();
    this.currentScene = null;
    this.currentSceneConfig = null;
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

  updateState(updates: Partial<SceneStateSnapshotState>): void {
    if (!this.currentState) {
      this.logger.warn('Cannot update state: No current state exists.');
      return;
    }
    this.currentState = { ...this.currentState, ...updates };
    // Note: Emitting state updates should likely happen after calling this.
  }

  // --- Message Management ---

  async addMessageToState(message: Message): Promise<void> {
    if (!this.currentState || !this.currentStateId) {
      this.logger.warn('Cannot add message: No current state exists.');
      return;
    }

    const updatedState = await this.scenesDb.addMessageToState(this.currentStateId, message);

    // Update the state with the new messages array
    this.currentState = updatedState.state;

    this.logger.debug(
      { timestamp: message.timestamp, characterId: message.character },
      `Added message from ${message.character} to scene state`,
    );
  }

  // --- Initialization ---

  initializeStateFromConfig(
    scene: Scene,
    sceneConfig: SceneConfig,
    initialVisitorCount: number,
  ): SceneStateSnapshotState {
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
          characterStateParseResult.error.flatten(),
          `Failed to parse initial state for character ${charId}`,
        );
        // Potentially throw an error here?
      }
    }

    const initialState: SceneStateSnapshotState = {
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
    this.currentStateId = null;
    this.currentScene = scene;
    this.currentSceneConfig = sceneConfig;

    this.logger.info('Scene state initialized successfully from config.');
    return initialState;
  }

  // --- Snapshot Management ---

  async loadLatestSnapshotForScene(sceneId: number): Promise<SceneStateSnapshotState | null> {
    this.logger.debug(`Loading latest snapshot for scene ${sceneId}...`);
    const latestSnapshot = await this.scenesDb.findLatestState(sceneId);

    if (!latestSnapshot) {
      this.logger.warn(`No snapshot found for scene ${sceneId}`);
      return null;
    }

    this.currentState = latestSnapshot.state;
    this.currentStateId = latestSnapshot.id;

    return this.currentState;
  }

  async saveSnapshot(): Promise<void> {
    if (!this.currentState) {
      this.logger.warn('Cannot save snapshot: No current state exists.');
      return;
    }
    if (!this.currentScene) {
      this.logger.warn('Cannot save snapshot: No current scene exists.');
      return;
    }

    if (this.currentState.scene_id !== this.currentScene.id) {
      this.logger.error(
        `Cannot save snapshot: Current state scene ID (${this.currentState.scene_id}) does not match provided scene ID (${this.currentScene.id}).`,
      );
      return;
    }

    this.logger.debug(`Saving snapshot for scene ${this.currentScene.id}...`);
    const newStateSnapshotData: NewSceneStateSnapshot = {
      state: this.currentState,
      sceneId: this.currentScene.id,
      configId: this.currentState.scene_config_id,
    };
    try {
      const newStateSnapshot = await this.scenesDb.createStateSnapshot(newStateSnapshotData);

      this.currentStateId = newStateSnapshot.id;

      this.logger.info(`Snapshot saved for scene ${this.currentScene.id}.`);
    } catch (error) {
      this.logger.error(
        { error },
        `Failed to save state snapshot for scene ${this.currentScene.id}`,
      );
      // Potentially re-throw or handle differently
      throw error;
    }
  }
}
