import { Scene } from 'phaser';
import { Logger } from '../utils/logger';
import { CharacterManager } from './managers/CharacterManager';
import { EventManager } from './managers/EventManager';
import { SpeechBubbleManager } from './managers/SpeechBubbleManager';
import { StateManager } from './managers/StateManager';

export class MainScene extends Scene {
  private characterManager!: CharacterManager;
  private speechBubbleManager!: SpeechBubbleManager;
  private stateManager!: StateManager;
  private eventManager!: EventManager;
  public isModalOpen: boolean = false;

  constructor() {
    super({ key: 'MainScene' });
  }

  init(): void {
    Logger.info(this.constructor.name, 'init() called');
    // Initialize managers
    this.characterManager = new CharacterManager(this);
    this.speechBubbleManager = new SpeechBubbleManager(
      this,
      this.characterManager,
    );
    this.stateManager = new StateManager(
      this,
      this.characterManager,
      this.speechBubbleManager,
    );
    this.eventManager = new EventManager(this, this.stateManager);

    // Reset all managers
    this.characterManager.reset();
    this.speechBubbleManager.reset();
    this.stateManager.reset();

    // Set up modal event listeners
    this.events.on('modalOpen', () => {
      Logger.info(
        this.constructor.name,
        'Modal opened, pausing scene interactions',
      );
      this.isModalOpen = true;
    });

    this.events.on('modalClose', () => {
      Logger.info(
        this.constructor.name,
        'Modal closed, resuming scene interactions',
      );
      this.isModalOpen = false;
    });
  }

  preload(): void {
    Logger.info(this.constructor.name, 'preload() called');
    // Load room background
    this.load.image('room', '/assets/scenes/room.png');

    // Load character assets
    this.characterManager.preload();
  }

  create(): void {
    Logger.info(this.constructor.name, 'create() called');

    // Set up room background
    this.add.image(0, 0, 'room').setOrigin(0, 0);

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
