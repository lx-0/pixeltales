import { socketService } from '@/services/socket';
import { Logger } from '@/utils/logger';
import { type SceneStateSnapshot } from '@pixeltales/contracts';
import { Scene } from 'phaser';
import { StateManager } from './StateManager';

export class EventManager {
  constructor(
    private scene: Scene,
    private stateManager: StateManager,
  ) {}

  setupEventListeners(): void {
    Logger.info(this.constructor.name, 'Setting up event listeners');

    // Set up history mode event listeners
    this.scene.game.events.on('historyModeChange', this.handleHistoryModeChange, this);
    this.scene.game.events.on('historyNavigate', this.handleHistoryNavigate, this);

    // Set up socket event listeners
    // Purpose: Listen for state updates from the server to update the Phaser game world.
    socketService.addListener('scene_state', this.handleSceneStateUpdate.bind(this));

    // Debug: check socket health and replay last scene_state if available
    const health = socketService.checkSocketHealth();
    Logger.info(this.constructor.name, 'Socket health at setup', health);
    if (health.lastData) {
      Logger.info(this.constructor.name, 'Replaying cached scene_state to initialize scene');
      this.handleSceneStateUpdate(health.lastData);
    }
  }

  private handleHistoryModeChange(isInHistoryMode: boolean): void {
    Logger.info(
      this.constructor.name,
      `Handling historyModeChange event with isInHistoryMode: ${isInHistoryMode}`,
    );
    this.stateManager.historyModeChange(isInHistoryMode);
  }

  private handleHistoryNavigate(index: number): void {
    Logger.info(this.constructor.name, `Handling historyNavigate event with index: ${index}`);
    this.stateManager.navigateHistory(index);
  }

  private handleSceneStateUpdate(state: SceneStateSnapshot): void {
    Logger.info(this.constructor.name, '[FLOW 2/5] Handling scene state update');
    Logger.info(this.constructor.name, '➡️ Calling StateManager.updateState', {
      stateValidity: state ? 'Valid' : 'Invalid',
    });
    this.stateManager.updateState(state);
  }

  destroy(): void {
    Logger.info(this.constructor.name, 'Cleaning up event listeners');

    // Remove history mode event listeners
    this.scene.game.events.off('historyModeChange', this.handleHistoryModeChange, this);
    this.scene.game.events.off('historyNavigate', this.handleHistoryNavigate, this);

    // Remove socket event listeners
    socketService.removeListener('scene_state', this.handleSceneStateUpdate.bind(this));
  }
}
