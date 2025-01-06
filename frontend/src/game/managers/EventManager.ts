import type { SceneState } from '@/types/scene';
import { Scene } from 'phaser';
import { socketService } from '../../services/socket';
import { Logger } from '../../utils/logger';
import { StateManager } from './StateManager';

export class EventManager {
  constructor(private scene: Scene, private stateManager: StateManager) {}

  setupEventListeners(): void {
    Logger.info(this.constructor.name, 'Setting up event listeners');

    // Set up history mode event listeners
    this.scene.game.events.on(
      'historyModeChange',
      this.handleHistoryModeChange,
      this,
    );
    this.scene.game.events.on(
      'historyNavigate',
      this.handleHistoryNavigate,
      this,
    );

    // Set up socket event listeners
    socketService.addListener(
      'scene_state',
      this.handleSceneStateUpdate.bind(this),
    );
  }

  private handleHistoryModeChange(isInHistoryMode: boolean): void {
    Logger.info(
      this.constructor.name,
      `Handling historyModeChange event with isInHistoryMode: ${isInHistoryMode}`,
    );
    this.stateManager.historyModeChange(isInHistoryMode);
  }

  private handleHistoryNavigate(index: number): void {
    Logger.info(
      this.constructor.name,
      `Handling historyNavigate event with index: ${index}`,
    );
    this.stateManager.navigateHistory(index);
  }

  private handleSceneStateUpdate(state: SceneState): void {
    Logger.info(this.constructor.name, 'Handling scene state update');
    this.stateManager.updateState(state);
  }

  destroy(): void {
    Logger.info(this.constructor.name, 'Cleaning up event listeners');

    // Remove history mode event listeners
    this.scene.game.events.off(
      'historyModeChange',
      this.handleHistoryModeChange,
      this,
    );
    this.scene.game.events.off(
      'historyNavigate',
      this.handleHistoryNavigate,
      this,
    );

    // Remove socket event listeners
    socketService.removeListener(
      'scene_state',
      this.handleSceneStateUpdate.bind(this),
    );
  }
}
