import type { Scene } from 'phaser';
import type { SceneState } from '@/types/scene';
import { Logger } from '@/utils/logger';
import { TILE_SIZE } from '../config';
import type { HistoryManager } from './HistoryManager';
import { UIControlsFactory } from './UIControlsFactory';

export interface HistoryControls {
  container: Phaser.GameObjects.Container;
  playButton: Phaser.GameObjects.Sprite;
  pauseButton: Phaser.GameObjects.Sprite;
  headlineDisplay: Phaser.GameObjects.Text;
  metadataDisplay: Phaser.GameObjects.Text;
  navigationContainer: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.Graphics;
  containerHeight: number;
  liveContainerHeight: number;
}

const CONTROLS_PADDING = 10;
const HISTORY_WIDTH = 320;
const HISTORY_HEIGHT = 110;

export class UIControlsManager {
  private controls: HistoryControls | null = null;
  private historyManager: HistoryManager | null = null;
  private readonly factory: UIControlsFactory;

  constructor(private readonly scene: Scene) {
    this.factory = new UIControlsFactory(scene);
  }

  setHistoryManager(historyManager: HistoryManager): void {
    this.historyManager = historyManager;
  }

  createControls(historyManager?: HistoryManager): void {
    if (historyManager) {
      this.historyManager = historyManager;
    }

    const liveContainerHeight = TILE_SIZE;
    const liveContainerWidth = TILE_SIZE;
    const container = this.scene.add.container(
      this.scene.cameras.main.width - (CONTROLS_PADDING + liveContainerWidth),
      CONTROLS_PADDING
    );

    const bg = this.factory.createBackground(liveContainerWidth, liveContainerHeight);
    container.add(bg);

    const playButton = this.factory.createButton(20, 20, 861, 'play');
    const pauseButton = this.factory.createButton(20, 20, 910, 'pause');
    playButton.setVisible(false);

    const headlineDisplay = this.factory.createHeadlineDisplay(60, 18);
    headlineDisplay.setVisible(false);

    const metadataDisplay = this.factory.createMetadataDisplay(16, 48, HISTORY_WIDTH);
    metadataDisplay.setVisible(false);

    const navigationContainer = this.scene.add.container(HISTORY_WIDTH - 70, 28);
    navigationContainer.setVisible(false);

    container.add([playButton, pauseButton, headlineDisplay, metadataDisplay, navigationContainer]);

    this.controls = {
      container,
      playButton,
      pauseButton,
      headlineDisplay,
      metadataDisplay,
      navigationContainer,
      background: bg,
      containerHeight: HISTORY_HEIGHT,
      liveContainerHeight,
    };

    this.factory.attachHoverFeedback(playButton);
    this.factory.attachHoverFeedback(pauseButton);
    this.setupPlayPauseHandlers(playButton, pauseButton);

    container.setDepth(2000);

    this.scene.scale.on('resize', () => this.handleResize(), this);

    this.scene.game.events.on(
      'historyModeChange',
      () => {
        Logger.info(this.constructor.name, 'History mode changed');
        this.updateControlsVisibility();
        this.updateControlsContent();
      },
      this
    );

    this.scene.game.events.on('historyNavigate', (_index: number) => {
      Logger.info(this.constructor.name, 'History navigation event received');
      this.updateControlsContent();
    });

    this.updateControlsVisibility();
    this.updateControlsContent();
  }

  getControls(): HistoryControls | null {
    return this.controls;
  }

  destroy(): void {
    if (this.controls) {
      this.controls.container.destroy();
      this.controls = null;
    }
    this.scene.scale.off('resize');
    this.scene.game.events.off('historyModeChange');
    this.scene.game.events.off('historyNavigate');
  }

  updateHeadlineDisplay(
    isHistoryMode: boolean,
    currentMessage: SceneState['messages'][0] | undefined,
    currentIndex: number,
    totalMessages: number
  ): void {
    if (!this.controls) return;

    if (!isHistoryMode) {
      this.controls.headlineDisplay.setText('Live Mode');
      return;
    }
    if (!currentMessage) {
      this.controls.headlineDisplay.setText('(no messages)');
      return;
    }
    const date = new Date(currentMessage.timestamp);
    this.controls.headlineDisplay.setText(
      `${date.toLocaleTimeString()} (${currentIndex + 1}/${totalMessages})`
    );
  }

  updateMetadataDisplay(
    isHistoryMode: boolean,
    currentMessage: SceneState['messages'][0] | undefined,
    currentIndex: number,
    totalMessages: number
  ): void {
    if (!this.controls) return;

    if (!isHistoryMode) {
      this.controls.metadataDisplay.setText('');
      return;
    }
    if (!currentMessage) {
      this.controls.metadataDisplay.setText('no messages');
      return;
    }
    const timestamp = new Date(currentMessage.timestamp);
    const formattedTime = timestamp.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const formattedDate = timestamp.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
    const separator = '·';
    this.controls.metadataDisplay.setText(
      `${currentMessage.character} ${separator} ${formattedTime} ${formattedDate}\n` +
        `Message ${currentIndex + 1} of ${totalMessages}`
    );
  }

  private handleResize(): void {
    if (!this.controls) return;
    const isHistoryMode = this.historyManager?.isInHistoryMode() ?? false;
    const padding = isHistoryMode ? HISTORY_WIDTH : TILE_SIZE;
    this.controls.container.setPosition(
      this.scene.cameras.main.width - (CONTROLS_PADDING + padding),
      CONTROLS_PADDING
    );
  }

  private createNavigationButtons(): void {
    if (!this.controls?.navigationContainer || !this.historyManager) return;

    const prevButton = this.factory.createNavButton(0, 0, 862, 'prev');
    const nextButton = this.factory.createNavButton(32, 0, 861, 'next');

    for (const button of [prevButton, nextButton]) {
      this.factory.attachNavPressFeedback(button, () => {
        this.scene.game.events.emit(
          'historyNavigateTo',
          button.getData('type') === 'prev' ? -1 : 1
        );
      });
    }

    this.controls.navigationContainer.add([prevButton, nextButton]);
  }

  private setupPlayPauseHandlers(
    playButton: Phaser.GameObjects.Sprite,
    pauseButton: Phaser.GameObjects.Sprite
  ): void {
    if (!this.historyManager) {
      Logger.error(this.constructor.name, 'HistoryManager not set');
      return;
    }

    playButton.on('pointerdown', () => {
      Logger.info(this.constructor.name, 'Play button clicked');
      this.scene.game.events.emit('exitHistoryMode');
    });

    pauseButton.on('pointerdown', () => {
      Logger.info(this.constructor.name, 'Pause button clicked');
      this.scene.game.events.emit('enterHistoryMode');
    });
  }

  private updateControlsVisibility = (): void => {
    if (!this.controls) return;

    const isHistoryMode = this.historyManager?.isInHistoryMode() ?? false;
    Logger.info(
      this.constructor.name,
      `Updating controls visibility: ${isHistoryMode ? 'history' : 'live'} mode`
    );

    this.controls.playButton.setVisible(isHistoryMode);
    this.controls.pauseButton.setVisible(!isHistoryMode);

    const padding = isHistoryMode ? HISTORY_WIDTH : TILE_SIZE;
    this.controls.container.setPosition(
      this.scene.cameras.main.width - (CONTROLS_PADDING + padding),
      CONTROLS_PADDING
    );

    if (isHistoryMode) {
      this.createNavigationButtons();
      this.controls.background.clear();
      this.controls.background = this.factory.createBackground(
        HISTORY_WIDTH,
        this.controls.containerHeight
      );
      this.controls.container.add(this.controls.background);
      this.controls.background.setPosition(0, 0);
      this.controls.container.sendToBack(this.controls.background);
      this.controls.headlineDisplay.setVisible(true);
      this.controls.metadataDisplay.setVisible(true);
      this.controls.navigationContainer.setVisible(true);
      this.controls.playButton.setPosition(32, 28);
      this.controls.pauseButton.setPosition(32, 28);
    } else {
      this.controls.navigationContainer.removeAll(true);
      this.controls.background.clear();
      this.controls.background = this.factory.createBackground(TILE_SIZE, TILE_SIZE);
      this.controls.container.add(this.controls.background);
      this.controls.background.setPosition(0, 0);
      this.controls.container.sendToBack(this.controls.background);
      this.controls.headlineDisplay.setVisible(false);
      this.controls.metadataDisplay.setVisible(false);
      this.controls.navigationContainer.setVisible(false);
      this.controls.playButton.setPosition(20, 20);
      this.controls.pauseButton.setPosition(20, 20);
    }
  };

  private updateControlsContent(): void {
    if (!this.controls) return;

    const isHistoryMode = this.historyManager?.isInHistoryMode() ?? false;
    Logger.info(
      this.constructor.name,
      `Updating controls content: ${isHistoryMode ? 'history' : 'live'} mode`
    );

    if (isHistoryMode && this.historyManager) {
      const messages = this.historyManager.getConversationHistory();
      const currentIndex = this.historyManager.getCurrentHistoryIndex();
      const currentMessage = messages[currentIndex];
      this.updateHeadlineDisplay(isHistoryMode, currentMessage, currentIndex, messages.length);
      this.updateMetadataDisplay(isHistoryMode, currentMessage, currentIndex, messages.length);
    } else {
      this.updateHeadlineDisplay(isHistoryMode, undefined, -1, -1);
      this.updateMetadataDisplay(isHistoryMode, undefined, -1, -1);
    }
  }
}
