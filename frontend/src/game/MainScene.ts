import { Scene } from 'phaser';
import type { Schemas } from '@/api/client';
import { Logger } from '../utils/logger';
import { CharacterManager } from './managers/CharacterManager';
import { EventManager } from './managers/EventManager';
import { SpeechBubbleManager } from './managers/SpeechBubbleManager';
import { StateManager } from './managers/StateManager';

export interface MainSceneInitData {
  catalog: Schemas['ConfigOptions'];
  sceneConfig: Schemas['SceneConfig'];
}

export class MainScene extends Scene {
  private characterManager!: CharacterManager;
  private speechBubbleManager!: SpeechBubbleManager;
  private stateManager!: StateManager;
  private eventManager!: EventManager;
  private catalog!: Schemas['ConfigOptions'];
  private sceneConfig!: Schemas['SceneConfig'];
  private roomAssetKey = 'room';
  public isModalOpen: boolean = false;

  constructor() {
    // active: false — App.tsx starts the scene explicitly with init data
    // once the catalog + active SceneConfig are loaded.
    super({ key: 'MainScene', active: false });
  }

  init(data: MainSceneInitData): void {
    Logger.info(this.constructor.name, 'init() called');

    if (!data?.catalog || !data?.sceneConfig) {
      throw new Error('MainScene.init() missing catalog or sceneConfig');
    }
    this.catalog = data.catalog;
    this.sceneConfig = data.sceneConfig;
    this.roomAssetKey = `room:${this.sceneConfig.room_id}`;

    // Initialize managers
    this.characterManager = new CharacterManager(this);
    this.speechBubbleManager = new SpeechBubbleManager(this, this.characterManager);
    this.stateManager = new StateManager(this, this.characterManager, this.speechBubbleManager);
    this.eventManager = new EventManager(this, this.stateManager);

    // Hand the catalog + scene config to the character manager so its
    // preload() can queue the right sprite loads.
    this.characterManager.setSceneContext(this.catalog, this.sceneConfig);

    // Reset all managers
    this.characterManager.reset();
    this.speechBubbleManager.reset();
    this.stateManager.reset();

    // Set up modal event listeners
    this.events.on('modalOpen', () => {
      Logger.info(this.constructor.name, 'Modal opened, pausing scene interactions');
      this.isModalOpen = true;
    });

    this.events.on('modalClose', () => {
      Logger.info(this.constructor.name, 'Modal closed, resuming scene interactions');
      this.isModalOpen = false;
    });
  }

  preload(): void {
    Logger.info(this.constructor.name, 'preload() called');

    // Load the configured room background.
    const room = this.catalog.rooms.find((r) => r.id === this.sceneConfig.room_id);
    if (!room) {
      Logger.warn(
        this.constructor.name,
        `Room "${this.sceneConfig.room_id}" not in catalog — falling back to first available`
      );
    }
    const roomPath = room?.path ?? this.catalog.rooms[0]?.path ?? '/assets/scenes/room.png';
    this.load.image(this.roomAssetKey, roomPath);

    // Load character assets via the character manager (driven by sceneConfig).
    this.characterManager.preload();
  }

  create(): void {
    Logger.info(this.constructor.name, 'create() called');

    // Set up room background
    this.add.image(0, 0, this.roomAssetKey).setOrigin(0, 0);

    // Initialize character animations
    this.characterManager.create();

    // Set up event listeners
    this.characterManager.setupEventListeners();
    this.eventManager.setupEventListeners();

    // Set up scene shutdown handler
    this.events.once('shutdown', this.handleShutdown, this);
  }

  private handleShutdown(): void {
    Logger.info(this.constructor.name, 'Handling scene shutdown');
    this.eventManager.destroy();
    this.speechBubbleManager.destroy();
    this.characterManager.destroy();

    // Clean up modal event listeners
    this.events.off('modalOpen');
    this.events.off('modalClose');
  }
}
