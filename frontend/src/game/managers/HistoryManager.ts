import type { SceneState } from '@/types/scene';
import { Scene } from 'phaser';
import { Logger } from '../../utils/logger';
import { UIControlsManager } from './UIControlsManager';

export class HistoryManager {
  private historyMode: boolean = false;
  private currentHistoryIndex: number = -1;
  private conversationHistory: SceneState['messages'] = [];
  private scene: Scene;
  private uiControlsManager: UIControlsManager;

  constructor(scene: Scene, uiControlsManager: UIControlsManager) {
    this.scene = scene;
    this.uiControlsManager = uiControlsManager;
  }

  initialize(): void {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Set up history mode event listeners
    this.scene.game.events.on(
      'enterHistoryMode',
      this.handleEnterHistoryMode,
      this,
    );
    this.scene.game.events.on(
      'exitHistoryMode',
      this.handleExitHistoryMode,
      this,
    );
    this.scene.game.events.on(
      'historyNavigateTo',
      this.handleHistoryNavigateTo,
      this,
    );

    // Listen for scene state updates from the game event system
    this.scene.game.events.on('sceneStateUpdate', (state: SceneState) => {
      // Only update conversation history in live mode
      if (!this.historyMode) {
        this.conversationHistory = state.messages;
        this.currentHistoryIndex = this.conversationHistory.length - 1;
      }
    });
  }

  private handleEnterHistoryMode(): void {
    Logger.info(this.constructor.name, `Handling enterHistoryMode event`);

    this.historyMode = true;
    this.currentHistoryIndex = this.conversationHistory.length - 1;

    this.scene.game.events.emit('historyModeChange', true);
  }

  private handleExitHistoryMode(): void {
    Logger.info(this.constructor.name, 'Handling exitHistoryMode event');

    this.historyMode = false;
    this.currentHistoryIndex = this.conversationHistory.length - 1;

    this.scene.game.events.emit('historyModeChange', false);
  }

  private handleHistoryNavigateTo(direction: number): void {
    Logger.info(
      this.constructor.name,
      `Handling historyNavigateTo event with direction: ${direction}, current index: ${this.currentHistoryIndex}`,
    );
    this.navigateHistory(direction);
  }

  private navigateHistory(direction: number): void {
    Logger.info(
      this.constructor.name,
      `navigateHistory called with direction: ${direction}`,
    );
    const newIndex = this.currentHistoryIndex + direction;
    Logger.info(
      this.constructor.name,
      `Current index: ${this.currentHistoryIndex}, New index: ${newIndex}`,
    );

    if (newIndex >= 0 && newIndex < this.conversationHistory.length) {
      this.currentHistoryIndex = newIndex;
      const message = this.conversationHistory[newIndex];

      Logger.info(this.constructor.name, `Navigating to message:`, {
        message,
      });

      Logger.info(
        this.constructor.name,
        `Emitting historyNavigate event with index: ${this.currentHistoryIndex}`,
      );
      this.scene.game.events.emit('historyNavigate', this.currentHistoryIndex);
    } else {
      Logger.warn(this.constructor.name, `Invalid history index: ${newIndex}`);
      // Add visual feedback for invalid navigation
      const controls = this.uiControlsManager.getControls();
      if (controls?.navigationContainer) {
        const button = controls.navigationContainer.list[
          direction === -1 ? 0 : 1
        ] as Phaser.GameObjects.Sprite;
        if (button) {
          this.scene.tweens.add({
            targets: button,
            alpha: 0.3,
            duration: 100,
            yoyo: true,
            ease: 'Steps',
            easeParams: [2],
          });
        }
      }
    }
  }

  isInHistoryMode(): boolean {
    return this.historyMode;
  }

  getCurrentHistoryIndex(): number {
    return this.currentHistoryIndex;
  }

  getConversationHistory(): SceneState['messages'] {
    return this.conversationHistory;
  }

  destroy(): void {
    // Remove game event listeners
    this.scene.game.events.off('sceneStateUpdate');

    // Remove scene event listeners
    this.scene.game.events.removeListener(
      'enterHistoryMode',
      this.handleEnterHistoryMode,
      this,
    );
    this.scene.game.events.removeListener(
      'exitHistoryMode',
      this.handleExitHistoryMode,
      this,
    );
    this.scene.game.events.removeListener(
      'historyNavigateTo',
      this.handleHistoryNavigateTo,
      this,
    );
  }
}
