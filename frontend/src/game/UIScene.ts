import { Scene } from 'phaser';
import { Logger } from '../utils/logger';
import { TILE_SIZE } from './config';
import { ConnectionManager } from './managers/ConnectionManager';
import { HistoryManager } from './managers/HistoryManager';
import { UIControlsManager } from './managers/UIControlsManager';

export class UIScene extends Scene {
  private uiControlsManager!: UIControlsManager;
  private connectionManager!: ConnectionManager;
  protected historyManager!: HistoryManager;
  private keyboardControls: {
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    history: Phaser.Input.Keyboard.Key;
  } | null = null;
  private isInteractionEnabled: boolean = true;

  constructor() {
    super({ key: 'UIScene', active: true });
  }

  preload(): void {
    // Load UI assets
    this.load.spritesheet(
      'ui_controls',
      '/assets/ui/Modern_UI_Style_2_48x48.png',
      {
        frameWidth: TILE_SIZE,
        frameHeight: TILE_SIZE,
      },
    );
  }

  create(): void {
    // Set up scene lifecycle events
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.handleDestroy, this);

    // Create managers
    this.uiControlsManager = new UIControlsManager(this);
    this.connectionManager = new ConnectionManager(this);
    this.historyManager = new HistoryManager(this, this.uiControlsManager);

    // Initialize managers
    this.uiControlsManager.createControls(this.historyManager);
    this.connectionManager.initialize();
    this.historyManager.initialize();

    // Set up keyboard controls
    this.setupKeyboardControls();

    // Set up modal event listeners
    this.events.on('modalOpen', () => {
      Logger.info(this.constructor.name, 'Modal opened, disabling game input');
      this.isInteractionEnabled = false;

      // Remove keyboard capture to allow form inputs
      if (this.input.keyboard) {
        this.input.keyboard.clearCaptures();
        // Disable all key captures
        this.input.keyboard.enabled = false;
      }
    });

    this.events.on('modalClose', () => {
      Logger.info(this.constructor.name, 'Modal closed, enabling game input');
      this.isInteractionEnabled = true;

      // Re-enable keyboard input
      if (this.input.keyboard) {
        this.input.keyboard.enabled = true;
        // Re-setup keyboard controls
        this.setupKeyboardControls();
      }
    });
  }

  private setupKeyboardControls(): void {
    if (!this.input?.keyboard) return;

    // Set up keyboard controls
    this.keyboardControls = {
      left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      history: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H),
    };

    // Add keyboard event handlers
    this.input.keyboard.on('keydown-H', (event: KeyboardEvent) => {
      if (!this.isInteractionEnabled) {
        Logger.debug(
          this.constructor.name,
          'Ignoring H key - interactions disabled',
        );
        event.stopPropagation();
        event.preventDefault();
        return;
      }

      if (this.historyManager.isInHistoryMode()) {
        this.game.events.emit('exitHistoryMode');
      } else {
        this.game.events.emit('enterHistoryMode');
      }
    });

    // Add update event for continuous key checks
    this.events.on(Phaser.Scenes.Events.UPDATE, this.handleKeyboardInput, this);
  }

  private handleKeyboardInput(): void {
    if (!this.keyboardControls || !this.isInteractionEnabled) {
      return;
    }

    // Check if any form element is focused
    const activeElement = document.activeElement;
    if (
      activeElement &&
      (activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.tagName === 'SELECT' ||
        activeElement.hasAttribute('contenteditable') ||
        activeElement.closest('form') ||
        activeElement.getAttribute('role') === 'textbox')
    ) {
      return;
    }

    if (!this.historyManager.isInHistoryMode()) {
      return;
    }

    const { left, right } = this.keyboardControls;

    if (Phaser.Input.Keyboard.JustDown(left)) {
      this.game.events.emit('historyNavigateTo', -1);
      this.pulseNavigationButton('prev');
    } else if (Phaser.Input.Keyboard.JustDown(right)) {
      this.game.events.emit('historyNavigateTo', 1);
      this.pulseNavigationButton('next');
    }
  }

  private pulseNavigationButton(type: 'prev' | 'next'): void {
    const controls = this.uiControlsManager.getControls();
    if (!controls?.navigationContainer) return;

    const button = controls.navigationContainer.list[
      type === 'prev' ? 0 : 1
    ] as Phaser.GameObjects.Sprite;
    if (!button) return;

    // Save original scale
    const originalScale = button.scale;

    // Create pulse effect
    this.tweens.add({
      targets: button,
      scaleX: originalScale + 0.1,
      scaleY: originalScale + 0.1,
      duration: 100,
      yoyo: true,
      ease: 'Quad.easeInOut',
      onComplete: () => {
        button.setScale(originalScale);
      },
    });
  }

  private handleShutdown(): void {
    // Clean up event listeners
    if (this.keyboardControls && this.input?.keyboard) {
      this.input.keyboard.off('keydown-H');
      this.events.off(
        Phaser.Scenes.Events.UPDATE,
        this.handleKeyboardInput,
        this,
      );
    }
  }

  private handleDestroy(): void {
    this.handleShutdown();

    // Clean up managers
    this.uiControlsManager.destroy();
    this.connectionManager.destroy();
    this.historyManager.destroy();
  }
}
