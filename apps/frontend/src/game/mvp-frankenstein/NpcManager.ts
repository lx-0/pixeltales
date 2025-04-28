import { TILE_SIZE } from '@/game/mvp-frankenstein/config';
import { Logger } from '@yesterday-ai/logger-frontend';
import { Scene } from 'phaser';

interface NpcCharacter {
  id: string;
  sprite: Phaser.GameObjects.Sprite;
}

/**
 * Manages non-player characters (NPCs) like the doctors.
 */
export class NpcManager {
  private npcs: Map<string, NpcCharacter> = new Map();

  constructor(private scene: Scene) {}

  preload(): void {
    // TODO: Load actual doctor spritesheets when available
    // Using existing assets as placeholders
    this.scene.load.spritesheet('doctor1_sprite', '/assets/characters/Doctor_1_48x48.png', {
      frameWidth: 48,
      frameHeight: 96,
    });
    this.scene.load.spritesheet('doctor2_sprite', '/assets/characters/Doctor_2_48x48.png', {
      frameWidth: 48,
      frameHeight: 96,
    });
  }

  create(): void {
    // Create NPCs
    this.createDoctor('doctor1', 'doctor1_sprite', { x: 12, y: 4 }, 'back');
    this.createDoctor('doctor2', 'doctor2_sprite', { x: 7, y: 5 }, 'right');
  }

  private createDoctor(
    npcId: string,
    spriteKey: string,
    tilePos: { x: number; y: number },
    direction: 'right' | 'back' | 'left' | 'front' = 'front',
    action: 'idle' | 'walk' = 'idle',
  ): void {
    if (this.npcs.has(npcId)) return;

    Logger.info(NpcManager.name, `Creating NPC: ${npcId}`);

    // Placeholder animations (just idle front)
    const framesPerAnimation = 6;
    const directions = ['right', 'back', 'left', 'front'] as const;
    const offsetFrames = directions.length * framesPerAnimation; // skip first row of frames in spritesheet
    directions.forEach((dir, index) => {
      const animKey = `${spriteKey}_${action}_${dir}`;
      if (!this.scene.anims.exists(animKey)) {
        this.scene.anims.create({
          key: animKey,
          frames: this.scene.anims.generateFrameNumbers(spriteKey, {
            start: index * framesPerAnimation + offsetFrames,
            end: index * framesPerAnimation + offsetFrames + framesPerAnimation - 1,
          }),
          frameRate: 8,
          repeat: -1,
        });
      }
    });

    const sprite = this.scene.add.sprite(
      tilePos.x * TILE_SIZE + TILE_SIZE / 2,
      tilePos.y * TILE_SIZE,
      spriteKey,
    );

    const animKey = `${spriteKey}_${action}_${direction}`;
    sprite.play(animKey);

    this.npcs.set(npcId, { id: npcId, sprite });
    Logger.info(NpcManager.name, `NPC ${npcId} created.`);
  }

  update(time: number, delta: number): void {
    // NPC update logic (e.g., simple patrol, idle animations)
  }

  getAllSprites(): Phaser.GameObjects.Sprite[] {
    return Array.from(this.npcs.values()).map((npc) => npc.sprite);
  }
}
