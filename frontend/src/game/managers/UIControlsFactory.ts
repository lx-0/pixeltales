import type { Scene } from 'phaser';

type NavType = 'prev' | 'next';
type CtrlType = 'play' | 'pause';

export class UIControlsFactory {
  constructor(private readonly scene: Scene) {}

  createBackground(width: number, height: number): Phaser.GameObjects.Graphics {
    const bg = this.scene.add.graphics();
    bg.lineStyle(2, 0x666666, 0.8);
    bg.fillStyle(0x222222, 0.9);

    const borderWidth = width - 10;
    const borderHeight = height - 10;
    const cornerSize = 4;
    const innerPadding = 2;

    bg.fillRect(0, 0, borderWidth, borderHeight);

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

    bg.lineStyle(1, 0x888888, 0.4);
    bg.beginPath();
    bg.moveTo(cornerSize + innerPadding, innerPadding);
    bg.lineTo(borderWidth - cornerSize - innerPadding, innerPadding);
    bg.lineTo(borderWidth - innerPadding, cornerSize + innerPadding);
    bg.lineTo(borderWidth - innerPadding, borderHeight - cornerSize - innerPadding);
    bg.lineTo(borderWidth - cornerSize - innerPadding, borderHeight - innerPadding);
    bg.lineTo(cornerSize + innerPadding, borderHeight - innerPadding);
    bg.lineTo(innerPadding, borderHeight - cornerSize - innerPadding);
    bg.lineTo(innerPadding, cornerSize + innerPadding);
    bg.lineTo(cornerSize + innerPadding, innerPadding);
    bg.strokePath();

    return bg;
  }

  createButton(x: number, y: number, frame: number, type: CtrlType): Phaser.GameObjects.Sprite {
    return this.scene.add
      .sprite(x, y, 'ui_controls', frame)
      .setInteractive()
      .setScale(0.5)
      .setTint(0xcccccc)
      .setData('type', type);
  }

  createNavButton(x: number, y: number, frame: number, type: NavType): Phaser.GameObjects.Sprite {
    return this.scene.add
      .sprite(x, y, 'ui_controls', frame)
      .setInteractive()
      .setScale(0.5)
      .setTint(0xcccccc)
      .setData('type', type);
  }

  createHeadlineDisplay(x: number, y: number): Phaser.GameObjects.Text {
    return this.scene.add.text(x, y, 'Live Mode', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#00000066',
      padding: { x: 4, y: 2 },
    });
  }

  createMetadataDisplay(x: number, y: number, containerWidth: number): Phaser.GameObjects.Text {
    return this.scene.add.text(x, y, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffffff',
      wordWrap: { width: containerWidth - 32 },
      backgroundColor: '#00000066',
      padding: { x: 4, y: 4 },
    });
  }

  attachHoverFeedback(button: Phaser.GameObjects.Sprite): void {
    button
      .on('pointerover', () => this.animateButton(button, 0.55, 0x88ff88))
      .on('pointerout', () => this.animateButton(button, 0.5, 0xcccccc));
  }

  attachNavPressFeedback(button: Phaser.GameObjects.Sprite, onRelease: () => void): void {
    button
      .on('pointerover', () => this.animateButton(button, 0.55, 0x88ff88))
      .on('pointerout', () => this.animateButton(button, 0.5, 0xcccccc))
      .on('pointerdown', () => {
        button.setTint(0x44ff44);
        button.setScale(0.48);
      })
      .on('pointerup', () => {
        button.setTint(0x88ff88);
        button.setScale(0.55);
        onRelease();
      });
  }

  private animateButton(button: Phaser.GameObjects.Sprite, scale: number, tint: number): void {
    this.scene.tweens.add({
      targets: button,
      scale,
      duration: 100,
      ease: 'Steps',
      easeParams: [4],
    });
    button.setTint(tint);
  }
}
