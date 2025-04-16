import type { SceneState } from '@/types/scene';
import { Scene } from 'phaser';
import { Logger } from '../../utils/logger';
import { CharacterManager } from './CharacterManager';
import { SpeechBubbleManager } from './SpeechBubbleManager';

export class StateManager {
  private currentState: SceneState | null = null;
  private isInHistoryMode = false;

  constructor(
    private scene: Scene,
    private characterManager: CharacterManager,
    private speechBubbleManager: SpeechBubbleManager,
  ) {}

  reset(): void {
    Logger.info(this.constructor.name, 'Resetting state manager');
    this.currentState = null;
    this.isInHistoryMode = false;
  }

  updateState(newState: SceneState): void {
    Logger.info(this.constructor.name, 'Updating state', {
      newState,
      isInHistoryMode: this.isInHistoryMode,
    });

    this.currentState = newState;

    if (!this.isInHistoryMode) {
      // Log character moods
      Object.entries(newState.characters).forEach(([charId, char]) => {
        Logger.info(
          this.constructor.name,
          `Character ${charId} mood: ${char.current_mood}`,
          { action: char.action },
        );
      });

      // Only update scene in live mode
      this.characterManager.updateCharacters(newState);
      this.speechBubbleManager.updateBubbles(newState);
      this.scene.game.events.emit('sceneStateUpdate', newState);
    }
  }

  historyModeChange(isInHistoryMode: boolean): void {
    Logger.info(
      this.constructor.name,
      `Handling historyModeChange event with isInHistoryMode: ${isInHistoryMode}`,
    );
    this.isInHistoryMode = isInHistoryMode;
    if (this.currentState) {
      if (isInHistoryMode) {
        this.speechBubbleManager.showHistoricalBubble(
          this.currentState.messages[this.currentState.messages.length - 1],
        );
      } else {
        this.characterManager.updateCharacters(this.currentState);
        this.speechBubbleManager.updateBubbles(this.currentState);
      }
    }
  }

  navigateHistory(index: number): void {
    Logger.info(this.constructor.name, `Navigating to history index: ${index}`);
    if (this.isInHistoryMode && this.currentState?.messages[index]) {
      // Update just the speech bubble for the selected message
      this.speechBubbleManager.showHistoricalBubble(
        this.currentState?.messages[index],
      );
    }
  }

  isHistoryMode(): boolean {
    return this.isInHistoryMode;
  }

  destroy(): void {
    Logger.info(this.constructor.name, 'Destroying state manager');
    this.reset();
  }
}
