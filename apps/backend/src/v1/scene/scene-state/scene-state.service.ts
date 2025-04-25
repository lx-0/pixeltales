import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  CharacterState,
  Message,
  Scene,
  SceneConfig,
  SceneStateSnapshot,
  SceneUtils,
} from '@pixeltales/contracts';
import { OptionalSome, toBoolean } from '@pixeltales/utils';
import { PinoLogger } from 'nestjs-pino';
import {
  ANSI_BACKGROUND_RED,
  ANSI_BOLD,
  ANSI_DIM,
  ANSI_RESET,
  hexToAnsi,
  LOGGER_CONTEXT_SHORTEN,
} from '../../../common/logger/logger.const';
import { ScenesDbService } from '../scenes-db/scenes-db.service';

type UnsavedSceneStateSnapshot = OptionalSome<SceneStateSnapshot, 'id' | 'timestamp'>;

@Injectable()
export class SceneStateService {
  private currentStateId: SceneStateSnapshot['id'] | null = null;
  private currentState: SceneStateSnapshot | null = null;
  private currentScene: Scene | null = null;
  private currentSceneConfig: SceneConfig | null = null;

  constructor(
    private readonly scenesDb: ScenesDbService,
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.logger.setContext(LOGGER_CONTEXT_SHORTEN ? '🎭' : SceneStateService.name);
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

  public getCurrentState(): SceneStateSnapshot | null {
    return this.currentState;
  }

  public resetCurrentState(): void {
    this.currentStateId = null;
    this.currentState = null;
    this.resetCurrentScene();

    // Emit event after setting the state
    this.broadcastState();
  }

  public getCurrentScene(): Scene | null {
    return this.currentScene;
  }

  public getCurrentSceneConfig(): SceneConfig | null {
    return this.currentSceneConfig;
  }

  private setCurrentScene(scene: Scene, config: SceneConfig): void {
    this.currentScene = scene;
    this.currentSceneConfig = config;
  }

  private resetCurrentScene(): void {
    this.currentScene = null;
    this.currentSceneConfig = null;
  }

  getCharacterState(characterId: CharacterState['id']): CharacterState | undefined {
    return this.currentState?.characters[characterId];
  }

  public async updateCharacterState(
    characterId: CharacterState['id'],
    updates: Partial<CharacterState>,
  ): Promise<void> {
    if (!this.currentState || !this.currentState.characters[characterId]) {
      this.logger.warn(`⚠️ Character ${characterId} not found in active state for update.`);
      return;
    }

    await this.updateState({
      characters: {
        ...this.currentState.characters,
        [characterId]: {
          ...this.currentState.characters[characterId],
          ...updates,
        },
      },
    });
  }

  /**
   * Updates the current state with the provided partial state.
   * Emits an event after updating the state.
   * Saves a snapshot after updating the state.
   * @param updates - The partial state to update.
   */
  public async updateState(
    updates: Omit<Partial<SceneStateSnapshot>, 'id' | 'timestamp'>,
  ): Promise<void> {
    if (!this.currentState) {
      this.logger.warn('⚠️ Cannot update state: No current state exists.');
      return;
    }

    // Create a new state object with the updates
    const updatedState = { ...this.currentState, ...updates, id: undefined, timestamp: undefined };

    // Check if the state has changed
    if (
      JSON.stringify(updatedState) ===
      JSON.stringify({ ...this.currentState, id: undefined, timestamp: undefined })
    ) {
      this.logger.debug('💤 No changes to state, skipping update.');
      return;
    }

    // Update the current state
    this.logger.debug(
      { updates },
      `🔄 Updating scene state with ${Object.keys(updates).length} updates`,
    );

    // Set and persist the state
    await this.setAndSave(updatedState);

    // Emit event after setting the state
    this.broadcastState();
  }

  async createState(
    state: UnsavedSceneStateSnapshot,
    broadcast = true,
  ): Promise<SceneStateSnapshot> {
    const newState = await this.setAndSave(state);
    if (broadcast) {
      this.broadcastState();
    }
    return newState;
  }

  /**
   * @deprecated Use `createState` instead.
   */
  async saveState(state: UnsavedSceneStateSnapshot, broadcast = true): Promise<void> {
    await this.setAndSave(state);
    if (broadcast) {
      this.broadcastState();
    }
  }

  public broadcastState(): void {
    this.eventEmitter.emit('scene.state.updated', { state: this.currentState });
  }

  // --- Message Management ---

  async addMessageToState(message: Message): Promise<void> {
    if (!this.currentState || !this.currentStateId) {
      this.logger.warn('⚠️ Cannot add message: No current state exists.');
      return;
    }

    // const updatedState = await this.scenesDb.addMessageToState(this.currentStateId, message);
    const updatedState = {
      ...this.currentState,
      messages: [...this.currentState.messages, message],
    };

    // Update the state with the new messages array
    await this.updateState(updatedState);

    this.logger.debug(
      { timestamp: message.timestamp, characterId: message.characterId },
      `Added message from ${message.characterId} to scene state`,
    );
  }

  // --- Initialization ---

  async initializeStateFromConfig(
    scene: Scene,
    sceneConfig: SceneConfig,
    isActive: boolean = false,
  ): Promise<SceneStateSnapshot> {
    this.logger.info(`Initializing scene state from config ${scene.configId}`);

    const initialState = SceneUtils.initializeStateFromConfig(sceneConfig, scene.id, isActive);

    this.setCurrentScene(scene, sceneConfig);
    const state = await this.createState(initialState);

    this.logger.info('Scene state initialized successfully from config.');
    return state;
  }

  // --- Snapshot Management ---

  async loadLatestSnapshot(sceneId: Scene['id']): Promise<SceneStateSnapshot | null> {
    this.logger.debug(`Loading latest snapshot for scene ${sceneId}...`);

    const latestSnapshot = await this.scenesDb.findLatestState(sceneId);
    if (!latestSnapshot) {
      this.logger.warn(`⚠️ No snapshot found for scene ${sceneId}`);
      return null;
    }

    const scene = await this.scenesDb.findById(sceneId);
    if (!scene) {
      this.logger.warn(`⚠️ No scene found for ID ${sceneId}`);
      return null;
    }

    const sceneConfig = await this.scenesDb.findConfigById(scene.configId);
    if (!sceneConfig) {
      this.logger.warn(`⚠️ No config found for scene ${sceneId}.`);
      return null;
    }

    this.setCurrentScene(scene, sceneConfig);

    this.currentState = latestSnapshot;
    this.currentStateId = latestSnapshot.id;

    return this.currentState;
  }

  private async setAndSave(newState: UnsavedSceneStateSnapshot): Promise<SceneStateSnapshot> {
    if (!this.currentScene) {
      this.logger.error(`❌ Cannot save snapshot: No current scene exists.`);
      throw new Error('Cannot save snapshot: No current scene exists.');
    }

    if (newState.sceneId !== this.currentScene.id) {
      this.logger.error(
        `❌ Cannot save snapshot: Current state scene ID (${newState.sceneId}) does not match provided scene ID (${this.currentScene.id}).`,
      );
      throw new Error(
        `Cannot save snapshot: Current state scene ID (${newState.sceneId}) does not match provided scene ID (${this.currentScene.id}).`,
      );
    }

    if (toBoolean(this.configService.get('DEBUG_API_SCENE_STATE'))) {
      this.logger.debug(`Saving snapshot for scene ${this.currentScene.id}...`);
    }

    try {
      const newStateSnapshot = await this.scenesDb.createStateSnapshot(newState);

      this.currentState = newStateSnapshot;
      this.currentStateId = newStateSnapshot.id;

      this.logger.info(`💾 Snapshot saved for scene ${this.currentScene.id}.`);

      return newStateSnapshot;
    } catch (error) {
      this.logger.error(
        { error },
        `❌ Failed to save state snapshot for scene ${this.currentScene.id}`,
      );
      // Potentially re-throw or handle differently
      throw error;
    }
  }

  // --- Logging ---

  /**
   * Formats the scene state for logging.
   * @param state - The scene state to format.
   * @returns A string representation of the scene state.
   */
  static formatForLogging(state: SceneStateSnapshot, visitors?: number): string {
    // console.log(`###`, { state: JSON.stringify(state, null, 2) });

    const characterTags = (charData: CharacterState) => {
      const tags = [];
      if (charData.endConversationRequested) {
        // background dark red
        tags.push(
          `${ANSI_BOLD}${ANSI_BACKGROUND_RED}*END CONVERSATION REQUESTED*${ANSI_RESET}${ANSI_DIM}`,
        );
      }
      return tags.join(' ');
    };

    const lastMessageOfCharacter = (charId: string, state: SceneStateSnapshot) => {
      const messages = state.messages.filter((message) => message.characterId === charId);
      return messages[messages.length - 1];
    };

    const characterDetails = Object.entries(state.characters).map(([_charId, charData]) => {
      const lastMessage =
        lastMessageOfCharacter(_charId, state)?.content?.slice(0, 16) ?? undefined;
      return (
        `   - ` +
        `${hexToAnsi(charData.color)}${ANSI_BOLD}${charData.name}${ANSI_RESET}${ANSI_DIM}` +
        ` is ${charData.action} ` +
        `${lastMessage ? `(${lastMessage}...)` : ''} ` +
        characterTags(charData)
      );
    });

    return [
      `🎭 Scene ID: ${state.sceneId}`,
      ...(visitors !== undefined ? [`📡 Visitors: ${visitors}`] : []),
      `👤 Characters (${Object.keys(state.characters).length}):`,
      ...characterDetails,
    ]
      .map((line) => `${ANSI_DIM}${line}${ANSI_RESET}`)
      .join('\n');
  }
}
