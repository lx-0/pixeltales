import type { Message, SceneState } from '@/types/scene';
import { Scene } from 'phaser';
import { Logger } from '../../utils/logger';
import { CharacterManager } from './CharacterManager';

interface SpeechBubble {
  container: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.Graphics;
  text: Phaser.GameObjects.Text;
  nameText: Phaser.GameObjects.Text;
  moodText: Phaser.GameObjects.Text;
  progressBar?: {
    background: Phaser.GameObjects.Graphics;
    fill: Phaser.GameObjects.Graphics;
  };
}

export class SpeechBubbleManager {
  private readonly BUBBLE_PADDING = 10;
  private readonly BUBBLE_POINTER_HEIGHT = 10;
  private readonly MIN_BUBBLE_WIDTH = 100;
  private readonly MAX_BUBBLE_WIDTH = 300;
  private readonly PROGRESS_BAR_HEIGHT = 4;

  private activeBubbles: Map<string, SpeechBubble> = new Map();

  constructor(
    private scene: Scene,
    private characterManager: CharacterManager,
  ) {}

  reset(): void {
    this.clearBubbles();
  }

  destroy(): void {
    this.clearBubbles();
  }

  clearBubbles(): void {
    this.activeBubbles.forEach((bubble) => {
      bubble.container.destroy();
    });
    this.activeBubbles.clear();
  }

  updateBubbles(state: SceneState): void {
    // Clear old bubbles first
    this.clearBubbles();

    // Create new bubble for current speaker
    for (const [key, value] of Object.entries(state.characters)) {
      if (value.action === 'speaking') {
        const character = this.characterManager.getCharacter(key);
        const message = state.messages
          .filter((m) => m.character === key)
          .slice(-1)[0];
        if (character && message.content) {
          Logger.info(
            this.constructor.name,
            `Creating speech bubble for ${key} with message ${message.content}`,
          );
          this.createSpeechBubble(
            character.sprite,
            message.content,
            key,
            value.name,
            message.calculated_speaking_time,
            message.mood,
            message.mood_emoji,
          );
        } else {
          Logger.info(
            this.constructor.name,
            `No character or message found for ${key}`,
            { character, message },
          );
        }
      }
    }
  }

  private createSpeechBubble(
    speaker: Phaser.GameObjects.Sprite,
    content: string,
    characterId: string,
    characterName: string,
    speakingTime?: number,
    _mood?: string,
    emoji?: string,
  ): void {
    // Calculate bubble dimensions
    const padding = this.BUBBLE_PADDING;
    const pointerHeight = this.BUBBLE_POINTER_HEIGHT;

    // Create text to measure dimensions
    const text = this.scene.add.text(0, 0, content, {
      fontSize: '16px',
      color: '#000000',
      wordWrap: { width: this.MAX_BUBBLE_WIDTH - padding * 2 },
    });

    // Get character color from state
    const character = this.characterManager.getCharacter(characterId);
    const characterColor = character?.color || '#000000';

    // Create name text with character color
    const nameText = this.scene.add.text(0, 0, characterName, {
      fontSize: '14px',
      color: characterColor,
      fontStyle: 'bold',
    });

    // Create mood emoji text
    const moodText = this.scene.add.text(0, 0, emoji ?? '', {
      fontSize: '14px',
    });

    // Calculate bubble width (with min/max constraints)
    const bubbleWidth = Math.max(
      this.MIN_BUBBLE_WIDTH,
      Math.min(
        Math.max(text.width, nameText.width + moodText.width + padding) +
          padding * 2,
        this.MAX_BUBBLE_WIDTH,
      ),
    );

    const bubbleHeight = text.height + nameText.height + padding * 3;

    // Create container for the bubble
    const container = this.scene.add.container(0, 0);

    // Create bubble background
    const background = this.scene.add.graphics();
    background.lineStyle(2, 0x000000, 1);
    background.fillStyle(0xffffff, 1);

    // Draw bubble background
    this.drawBubbleBackground(
      background,
      bubbleWidth,
      bubbleHeight,
      pointerHeight,
    );

    // Position texts within bubble
    nameText.setPosition(padding, padding);
    moodText.setPosition(bubbleWidth - moodText.width - padding, padding);
    text.setPosition(padding, padding * 2 + nameText.height);

    // Create progress bar if speaking time is set
    let progressBar: SpeechBubble['progressBar'] | undefined;

    if (speakingTime) {
      progressBar =
        speakingTime > 0
          ? this.createProgressBar(
              bubbleWidth,
              bubbleHeight,
              speakingTime,
              characterColor,
            )
          : undefined;
    }

    // Add everything to container
    container.add([background, nameText, moodText, text]);
    if (progressBar) {
      container.add([progressBar.background, progressBar.fill]);
    }

    // Position bubble above character
    const bubbleX = speaker.x - bubbleWidth / 2;
    const bubbleY =
      speaker.y - speaker.height / 2 - bubbleHeight - pointerHeight;
    container.setPosition(bubbleX, bubbleY);

    // Store the bubble
    this.activeBubbles.set(characterId, {
      container,
      background,
      text,
      nameText,
      moodText,
      progressBar,
    });
  }

  private drawBubbleBackground(
    graphics: Phaser.GameObjects.Graphics,
    width: number,
    height: number,
    pointerHeight: number,
  ): void {
    // Draw rounded rectangle for bubble
    graphics.beginPath();
    graphics.moveTo(0, 0);
    graphics.lineTo(width, 0);
    graphics.lineTo(width, height);
    graphics.lineTo(width / 2 + 10, height);
    graphics.lineTo(width / 2, height + pointerHeight);
    graphics.lineTo(width / 2 - 10, height);
    graphics.lineTo(0, height);
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
  }

  private createProgressBar(
    bubbleWidth: number,
    bubbleHeight: number,
    duration: number,
    characterColor: string,
  ): SpeechBubble['progressBar'] {
    if (duration <= 0) return undefined;

    // Make progress bar one third of bubble width
    const width = (bubbleWidth - this.BUBBLE_PADDING * 2) / 4;
    const x = ((bubbleWidth - this.BUBBLE_PADDING * 2) / 4) * 3;
    const y = bubbleHeight - this.PROGRESS_BAR_HEIGHT - 2 - 1;

    // Convert hex color to number for Phaser
    const colorNum = Number(characterColor.replace('#', '0x'));

    // Create background with character color border
    const background = this.scene.add.graphics();
    background.lineStyle(1, colorNum, 0.5); // Thin border in character color
    background.fillStyle(0xcccccc, 1);
    background.fillRect(x, y, width, this.PROGRESS_BAR_HEIGHT);
    background.strokeRect(x, y, width, this.PROGRESS_BAR_HEIGHT);

    // Create fill with character color
    const fill = this.scene.add.graphics();
    fill.fillStyle(colorNum, 1);
    fill.fillRect(x, y + 1, width, this.PROGRESS_BAR_HEIGHT - 1);

    // Animate the fill
    this.scene.tweens.add({
      targets: fill,
      scaleX: 0,
      x: x,
      duration: duration * 1000,
      ease: 'Linear',
    });

    return { background, fill };
  }

  showHistoricalBubble(message: Message): void {
    // Clear existing bubbles first
    this.clearBubbles();

    // Show bubble for the historical message
    const character = this.characterManager.getCharacter(message.character);
    if (character) {
      this.createSpeechBubble(
        character.sprite,
        message.content ?? '',
        message.character,
        character.state.name,
        undefined,
        message.mood,
        message.mood_emoji,
      );
    }
  }
}
