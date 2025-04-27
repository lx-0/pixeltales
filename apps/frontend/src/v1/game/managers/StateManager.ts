import { Logger } from '@/utils/logger';
import type { SceneStateSnapshot } from '@pixeltales/contracts';
import { Scene } from 'phaser';
import { CharacterManager } from './CharacterManager';
import { SpeechBubbleManager } from './SpeechBubbleManager';

export class StateManager {
  private currentState: SceneStateSnapshot | null = null;
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

  updateState(newState: SceneStateSnapshot): void {
    Logger.info(this.constructor.name, '[FLOW 3/5] Updating state', {
      newState,
      isInHistoryMode: this.isInHistoryMode,
    });

    this.currentState = newState;

    if (!this.isInHistoryMode) {
      Logger.info(this.constructor.name, '🟢 Not in history mode, proceeding with scene update');
      // Log character moods
      Object.entries(newState.characters).forEach(([charId, char]) => {
        Logger.info(this.constructor.name, `Character ${charId} mood: ${char.currentMood}`, {
          action: char.action,
        });
      });

      // Only update scene in live mode
      Logger.info(this.constructor.name, '➡️ Calling CharacterManager.updateCharacters');
      this.characterManager.updateCharacters(newState);
      Logger.info(this.constructor.name, '➡️ Calling SpeechBubbleManager.updateBubbles');
      this.speechBubbleManager.updateBubbles(newState);
      this.scene.game.events.emit('sceneStateUpdate', newState);
    } else {
      Logger.warn(this.constructor.name, '🟡 In history mode, skipping live scene update');
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
        const msg = this.currentState.messages[this.currentState.messages.length - 1];
        if (msg) {
          this.speechBubbleManager.showHistoricalBubble(msg);
        }
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
      this.speechBubbleManager.showHistoricalBubble(this.currentState?.messages[index]);
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
