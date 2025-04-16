import type { SceneState } from '@/types/scene';
import { Scene } from 'phaser';
import { Logger } from '../../utils/logger';
import { TILE_SIZE } from '../config';
import { HistoryManager } from './HistoryManager';

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

export class UIControlsManager {
  private readonly CONTROLS_PADDING = 10;
  private controls: HistoryControls | null = null;
  private scene: Scene;
  private historyManager: HistoryManager | null = null;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  setHistoryManager(historyManager: HistoryManager): void {
    this.historyManager = historyManager;
  }

  createControls(historyManager?: HistoryManager): void {
    if (historyManager) {
      this.historyManager = historyManager;
    }

    // Create main container for controls - moved to top-right with more padding
    const containerWidth = 320;
    const containerHeight = 110;
    const liveContainerHeight = TILE_SIZE;
    const liveContainerWidth = TILE_SIZE;
    const container = this.scene.add.container(
      this.scene.cameras.main.width -
        (this.CONTROLS_PADDING + liveContainerWidth),
      this.CONTROLS_PADDING,
    );

    // Create pixelated background with initial live mode height
    const bg = this.createBackground(liveContainerWidth, liveContainerHeight);
    container.add(bg);

    // Create play/pause buttons with pixel art styling
    const playButton = this.createButton(20, 20, 861, 'play');
    const pauseButton = this.createButton(20, 20, 910, 'pause');
    playButton.setVisible(false);

    // Create headline display (replaces time display)
    const headlineDisplay = this.createHeadlineDisplay(60, 18);
    headlineDisplay.setVisible(false); // Initially hidden in live mode

    // Create metadata display (for additional info in history mode)
    const metadataDisplay = this.createMetadataDisplay(16, 48, containerWidth);
    metadataDisplay.setVisible(false); // Initially hidden in live mode

    // Create navigation container (initially empty)
    const navigationContainer = this.scene.add.container(
      containerWidth - 70,
      28,
    );
    navigationContainer.setVisible(false); // Initially hidden in live mode

    // Add everything to main container
    container.add([
      playButton,
      pauseButton,
      headlineDisplay,
      metadataDisplay,
      navigationContainer,
    ]);

    // Store references
    this.controls = {
      container,
      playButton,
      pauseButton,
      headlineDisplay,
      metadataDisplay,
      navigationContainer,
      background: bg,
      containerHeight,
      liveContainerHeight,
    };

    // Set up button interactions
    this.setupButtonInteractions([playButton, pauseButton]);

    // Set up play/pause button handlers
    this.setupPlayPauseHandlers(playButton, pauseButton);

    // Set depth to ensure UI is above game scene
    container.setDepth(2000);

    // Add resize handler
    this.scene.scale.on(
      'resize',
      () => this.handleResize(containerWidth),
      this,
    );

    // Listen for history mode changes to update button visibility
    this.scene.game.events.on(
      'historyModeChange',
      () => {
        Logger.info(this.constructor.name, 'History mode changed');
        this.updateControlsVisibility();
        this.updateControlsContent();
      },
      this,
    );

    // Listen for history navigation to update time display
    this.scene.game.events.on('historyNavigate', (_index: number) => {
      Logger.info(this.constructor.name, 'History navigation event received');
      this.updateControlsContent();
    });

    // Set initial state
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

    // Remove resize event listener
    this.scene.scale.off('resize');

    // Remove game event listeners
    this.scene.game.events.off('historyModeChange');
    this.scene.game.events.off('historyNavigate');
  }

  private createBackground(
    width: number,
    height: number,
  ): Phaser.GameObjects.Graphics {
    const bg = this.scene.add.graphics();
    bg.lineStyle(2, 0x666666, 0.8);
    bg.fillStyle(0x222222, 0.9);

    const borderWidth = width - 10;
    const borderHeight = height - 10;
    const cornerSize = 4;
    const innerPadding = 2;

    // Main background
    bg.fillRect(0, 0, borderWidth, borderHeight);

    // Outer border with pixel corners
    bg.beginPath();
    bg.moveTo(cornerSize, 0);
    bg.lineTo(borderWidth - cornerSize, 0);
    bg.lineTo(borderWidth, cornerSize);
    bg.lineTo(borderWidth, borderHeight - cornerSize);
    bg.lineTo(borderWidth - cornerSize, borderHeight);
    bg.lineTo(cornerSize, borderHeight);
    bg.lineTo(0, borderHeight - cornerSize);
    bg.lineTo(0, cornerSize);
    bg.lineTo(cornerSize, 0);
    bg.strokePath();

    // Inner border for pixel art effect
    bg.lineStyle(1, 0x888888, 0.4);
    bg.beginPath();
    bg.moveTo(cornerSize + innerPadding, innerPadding);
    bg.lineTo(borderWidth - cornerSize - innerPadding, innerPadding);
    bg.lineTo(borderWidth - innerPadding, cornerSize + innerPadding);
    bg.lineTo(
      borderWidth - innerPadding,
      borderHeight - cornerSize - innerPadding,
    );
    bg.lineTo(
      borderWidth - cornerSize - innerPadding,
      borderHeight - innerPadding,
    );
    bg.lineTo(cornerSize + innerPadding, borderHeight - innerPadding);
    bg.lineTo(innerPadding, borderHeight - cornerSize - innerPadding);
    bg.lineTo(innerPadding, cornerSize + innerPadding);
    bg.lineTo(cornerSize + innerPadding, innerPadding);
    bg.strokePath();

    return bg;
  }

  private createButton(
    x: number,
    y: number,
    frame: number,
    type: 'play' | 'pause',
  ): Phaser.GameObjects.Sprite {
    return this.scene.add
      .sprite(x, y, 'ui_controls', frame)
      .setInteractive()
      .setScale(0.5)
      .setTint(0xcccccc)
      .setData('type', type);
  }

  private createHeadlineDisplay(x: number, y: number): Phaser.GameObjects.Text {
    return this.scene.add.text(x, y, 'Live Mode', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#00000066',
      padding: { x: 4, y: 2 },
    });
  }

  private createMetadataDisplay(
    x: number,
    y: number,
    containerWidth: number,
  ): Phaser.GameObjects.Text {
    return this.scene.add.text(x, y, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffffff',
      wordWrap: { width: containerWidth - 32 },
      backgroundColor: '#00000066',
      padding: { x: 4, y: 4 },
    });
  }

  private setupButtonInteractions(buttons: Phaser.GameObjects.Sprite[]): void {
    buttons.forEach((button) => {
      button
        .on('pointerover', () => this.handleButtonHover(button, true))
        .on('pointerout', () => this.handleButtonHover(button, false));
    });
  }

  private handleButtonHover(
    button: Phaser.GameObjects.Sprite,
    isOver: boolean,
  ): void {
    this.scene.tweens.add({
      targets: button,
      scale: isOver ? 0.55 : 0.5,
      duration: 100,
      ease: 'Steps',
      easeParams: [4],
    });
    button.setTint(isOver ? 0x88ff88 : 0xcccccc);
  }

  private handleResize(containerWidth: number): void {
    if (this.controls?.container) {
      const isHistoryMode = this.historyManager?.isInHistoryMode() ?? false;
      const padding = isHistoryMode ? containerWidth : TILE_SIZE; // Use smaller padding for live mode
      this.controls.container.setPosition(
        this.scene.cameras.main.width - (this.CONTROLS_PADDING + padding),
        this.CONTROLS_PADDING,
      );
    }
  }

  updateHeadlineDisplay(
    isHistoryMode: boolean,
    currentMessage: SceneState['messages'][0] | undefined,
    currentIndex: number,
    totalMessages: number,
  ): void {
    if (!this.controls) return;

    if (isHistoryMode) {
      if (!currentMessage) {
        this.controls.headlineDisplay.setText(`(no messages)`);
        return;
      }

      const date = new Date(currentMessage.timestamp);
      this.controls.headlineDisplay.setText(
        `${date.toLocaleTimeString()} (${currentIndex + 1}/${totalMessages})`,
      );
    } else {
      this.controls.headlineDisplay.setText('Live Mode');
    }
  }

  updateMetadataDisplay(
    isHistoryMode: boolean,
    currentMessage: SceneState['messages'][0] | undefined,
    currentIndex: number,
    totalMessages: number,
  ): void {
    if (!this.controls) return;

    if (isHistoryMode) {
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
        `${currentMessage.character} ${separator} ` +
          `${formattedTime} ${formattedDate}\n` +
          `Message ${currentIndex + 1} of ${totalMessages}`,
      );
    } else {
      this.controls.metadataDisplay.setText('');
    }
  }

  private createNavigationButtons(): void {
    if (!this.controls?.navigationContainer || !this.historyManager) return;

    const prevButton = this.scene.add
      .sprite(0, 0, 'ui_controls', 862)
      .setInteractive()
      .setScale(0.5)
      .setTint(0xcccccc)
      .setData('type', 'prev');

    const nextButton = this.scene.add
      .sprite(32, 0, 'ui_controls', 861)
      .setInteractive()
      .setScale(0.5)
      .setTint(0xcccccc)
      .setData('type', 'next');

    // Add hover effects with improved visual feedback
    [prevButton, nextButton].forEach((button) => {
      button
        .on('pointerover', () => {
          this.scene.tweens.add({
            targets: button,
            scale: 0.55,
            duration: 100,
            ease: 'Steps',
            easeParams: [4],
          });
          button.setTint(0x88ff88);
        })
        .on('pointerout', () => {
          this.scene.tweens.add({
            targets: button,
            scale: 0.5,
            duration: 100,
            ease: 'Steps',
            easeParams: [4],
          });
          button.setTint(0xcccccc);
        })
        .on('pointerdown', () => {
          button.setTint(0x44ff44);
          button.setScale(0.48); // Pixel-perfect press effect
        })
        .on('pointerup', () => {
          button.setTint(0x88ff88);
          button.setScale(0.55);
          this.scene.game.events.emit(
            'historyNavigateTo',
            button.getData('type') === 'prev' ? -1 : 1,
          );
        });
    });

    this.controls.navigationContainer.add([prevButton, nextButton]);
  }

  private setupPlayPauseHandlers(
    playButton: Phaser.GameObjects.Sprite,
    pauseButton: Phaser.GameObjects.Sprite,
  ): void {
    if (!this.historyManager) {
      Logger.error(this.constructor.name, 'HistoryManager not set');
      return;
    }

    // Update play/pause button handlers to emit events directly
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
      `Updating controls visibility: ${
        isHistoryMode ? 'history' : 'live'
      } mode`,
    );

    // Update play/pause button visibility and position
    this.controls.playButton.setVisible(isHistoryMode);
    this.controls.pauseButton.setVisible(!isHistoryMode);

    // Update container position based on mode
    const padding = isHistoryMode ? 320 : TILE_SIZE;
    this.controls.container.setPosition(
      this.scene.cameras.main.width - (this.CONTROLS_PADDING + padding),
      this.CONTROLS_PADDING,
    );

    // Update navigation buttons visibility
    if (isHistoryMode) {
      this.createNavigationButtons();
      // Reset to full width and height in history mode
      this.controls.background.clear();
      this.controls.background = this.createBackground(
        320,
        this.controls.containerHeight,
      );
      this.controls.container.add(this.controls.background);
      this.controls.background.setPosition(0, 0);
      // Ensure background is at the back
      this.controls.container.sendToBack(this.controls.background);
      // Show all controls
      this.controls.headlineDisplay.setVisible(true);
      this.controls.metadataDisplay.setVisible(true);
      this.controls.navigationContainer.setVisible(true);
      // Position buttons for history mode
      this.controls.playButton.setPosition(32, 28);
      this.controls.pauseButton.setPosition(32, 28);
    } else {
      // In live mode, remove all navigation buttons
      this.controls.navigationContainer.removeAll(true);
      // Reduce width and height in live mode
      this.controls.background.clear();
      this.controls.background = this.createBackground(TILE_SIZE, TILE_SIZE);
      this.controls.container.add(this.controls.background);
      this.controls.background.setPosition(0, 0);
      // Ensure background is at the back
      this.controls.container.sendToBack(this.controls.background);
      // Hide controls not needed in live mode
      this.controls.headlineDisplay.setVisible(false);
      this.controls.metadataDisplay.setVisible(false);
      this.controls.navigationContainer.setVisible(false);
      // Position button in live mode to match the relative position in non-live mode
      this.controls.playButton.setPosition(20, 20);
      this.controls.pauseButton.setPosition(20, 20);
    }
  };

  private updateControlsContent(): void {
    if (!this.controls) return;

    const isHistoryMode = this.historyManager?.isInHistoryMode() ?? false;

    Logger.info(
      this.constructor.name,
      `Updating controls content: ${isHistoryMode ? 'history' : 'live'} mode`,
    );

    if (isHistoryMode) {
      // Update metadata if we have a current message
      if (this.historyManager) {
        const messages = this.historyManager.getConversationHistory();
        const currentIndex = this.historyManager.getCurrentHistoryIndex();
        const currentMessage = messages[currentIndex];
        this.updateHeadlineDisplay(
          isHistoryMode,
          currentMessage,
          currentIndex,
          messages.length,
        );
        this.updateMetadataDisplay(
          isHistoryMode,
          currentMessage,
          currentIndex,
          messages.length,
        );
      } else {
        this.updateHeadlineDisplay(isHistoryMode, undefined, -1, -1);
        this.updateMetadataDisplay(isHistoryMode, undefined, -1, -1);
      }
    } else {
      this.updateHeadlineDisplay(isHistoryMode, undefined, -1, -1);
      this.updateMetadataDisplay(isHistoryMode, undefined, -1, -1);
    }
  }
}
