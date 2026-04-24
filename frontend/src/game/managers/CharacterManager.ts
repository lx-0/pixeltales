import type { Scene } from 'phaser';
import type { Schemas } from '@/api/client';
import type { CharacterAction, CharacterState, SceneState } from '@/types/scene';
import { Logger } from '../../utils/logger';
import { TILE_SIZE } from '../config';

interface Character {
  id: string;
  state: CharacterState;
  sprite: Phaser.GameObjects.Sprite;
  activeTween: Phaser.Tweens.Tween | null;
  thinkingSprite: Phaser.GameObjects.Sprite | null;
  color?: string;
}

type SpriteOption = Schemas['SpriteOption'];
type SceneConfig = Schemas['SceneConfig'];
type ConfigOptions = Schemas['ConfigOptions'];

export class CharacterManager {
  private readonly ACTIVE_TINT = 0xffffff;
  private readonly INACTIVE_TINT = 0xaaaaaa;
  private readonly BOUNCE_DURATION = 300; // ms
  private readonly BOUNCE_HEIGHT = 8; // pixels
  private readonly THINKING_OFFSET_Y = -60; // pixels above character

  private characters: Map<string, Character> = new Map();
  private animationsCreated = false;
  /** sprite_id → SpriteOption for every sprite required by the active scene */
  private sprites: Map<string, SpriteOption> = new Map();
  private sceneConfig: SceneConfig | null = null;

  constructor(private scene: Scene) {}

  /** Tell the manager which scene + asset catalog drive this run. Call before preload(). */
  setSceneContext(catalog: ConfigOptions, sceneConfig: SceneConfig): void {
    this.sceneConfig = sceneConfig;
    this.sprites.clear();
    for (const character of Object.values(sceneConfig.characters_config)) {
      if (this.sprites.has(character.sprite_id)) continue;
      const sprite = catalog.sprites.find((s) => s.id === character.sprite_id);
      if (!sprite) {
        Logger.warn(this.constructor.name, `Sprite "${character.sprite_id}" not in catalog`);
        continue;
      }
      this.sprites.set(character.sprite_id, sprite);
    }
  }

  preload(): void {
    if (!this.sceneConfig) {
      throw new Error('CharacterManager.preload() called before setSceneContext()');
    }
    // Load each unique character sprite. Animated sheets are 24 frames of 48×96
    // (4 directions × 6 idle frames). Static stills load as a 48×48 single-frame
    // sheet so the play()/animation pipeline below stays uniform.
    for (const sprite of this.sprites.values()) {
      if (sprite.has_idle_anim) {
        this.scene.load.spritesheet(sprite.id, sprite.path, {
          frameWidth: TILE_SIZE,
          frameHeight: TILE_SIZE * 2,
          startFrame: 0,
          endFrame: 23,
        });
      } else {
        this.scene.load.spritesheet(sprite.id, sprite.path, {
          frameWidth: TILE_SIZE,
          frameHeight: TILE_SIZE,
          startFrame: 0,
          endFrame: 0,
        });
      }
    }

    // Load thinking animation spritesheet
    this.scene.load.spritesheet('thinking', '/assets/ui/ui_thinking_48x96.png', {
      frameWidth: TILE_SIZE,
      frameHeight: TILE_SIZE * 2,
      startFrame: 0,
      endFrame: 9,
    });
  }

  create(): void {
    if (!this.animationsCreated) {
      this.createAnimations();
    }
  }

  reset(): void {
    this.characters.clear();
    this.animationsCreated = false;
  }

  destroy(): void {
    this.characters.forEach((character) => {
      character.sprite.destroy();
      if (character.thinkingSprite) {
        character.thinkingSprite.destroy();
      }
    });
    this.characters.clear();

    // Remove history mode event listener
    this.scene.game.events.off('historyModeChange', this.handleHistoryModeChange, this);
  }

  setupEventListeners(): void {
    // Set up history mode event listeners
    this.scene.game.events.on('historyModeChange', this.handleHistoryModeChange, this);
  }

  private handleHistoryModeChange(isInHistoryMode: boolean): void {
    Logger.info(
      this.constructor.name,
      `Handling historyModeChange event with isInHistoryMode: ${isInHistoryMode}`
    );
    if (isInHistoryMode) {
      this.clearCharactersAnimations();
    }
  }

  private createAnimations(): void {
    Logger.info(this.constructor.name, 'Creating character animations');
    const directions = ['right', 'back', 'left', 'front'] as const;

    this.sprites.forEach((sprite) => {
      directions.forEach((dir, index) => {
        const animKey = `${sprite.id}_idle_${dir}`;
        if (this.scene.anims.exists(animKey)) return;
        Logger.debug(this.constructor.name, `Creating animation: ${animKey}`);
        // Animated sheets: 6 frames per direction starting at index*6.
        // Static sheets: single frame 0 used for every direction.
        const frames = sprite.has_idle_anim
          ? this.scene.anims.generateFrameNumbers(sprite.id, {
              start: index * 6,
              end: index * 6 + 5,
            })
          : this.scene.anims.generateFrameNumbers(sprite.id, { start: 0, end: 0 });
        this.scene.anims.create({
          key: animKey,
          frames,
          frameRate: 8,
          repeat: -1,
        });
      });
    });

    // Create thinking animation
    if (!this.scene.anims.exists('thinking')) {
      Logger.info(this.constructor.name, 'Creating thinking animation');
      this.scene.anims.create({
        key: 'thinking',
        frames: this.scene.anims.generateFrameNumbers('thinking', {
          start: 0,
          end: 9,
        }),
        frameRate: 12,
        repeat: -1,
      });
    }

    this.animationsCreated = true;
  }

  clearCharacterAnimations(characterId: string): void {
    const character = this.characters.get(characterId);
    if (character) {
      if (character.activeTween) {
        character.activeTween.stop();
        character.activeTween = null;
      }
      // character.sprite.setTint(this.INACTIVE_TINT);
      if (character.thinkingSprite) {
        character.thinkingSprite.destroy();
        character.thinkingSprite = null;
      }
    }
  }

  clearCharactersAnimations(): void {
    this.characters.forEach((character) => {
      this.clearCharacterAnimations(character.id);
    });
  }

  private resolveSpriteId(characterId: string): string | null {
    const config = this.sceneConfig?.characters_config[characterId];
    if (!config) {
      Logger.warn(this.constructor.name, `No scene config for character "${characterId}"`);
      return null;
    }
    return config.sprite_id;
  }

  updateCharacters(state: SceneState): void {
    Object.entries(state.characters).forEach(([id, charData]) => {
      let character = this.characters.get(id);
      const spriteId = this.resolveSpriteId(id);
      if (!spriteId) return;

      if (!character) {
        // Create new character if it doesn't exist
        const sprite = this.scene.add.sprite(charData.position.x, charData.position.y, spriteId);
        character = {
          id,
          state: charData,
          sprite,
          activeTween: null,
          thinkingSprite: null,
          color: charData.color, // Store character color from state
        };
        this.characters.set(id, character);
      } else {
        // Update color in case it changed
        character.color = charData.color;
      }

      // Update character position and animation
      character.sprite.setPosition(charData.position.x, charData.position.y);
      character.sprite.play(`${spriteId}_idle_${charData.direction}`, true);

      // Update character tint and thinking state based on action
      this.updateCharacterState(character, charData);
    });
  }

  private updateCharacterState(character: Character, state: CharacterState): void {
    const previousState = character.state;
    character.state = state;

    const { action } = character.state;

    const isChange = action !== previousState?.action;
    Logger.info(
      this.constructor.name,
      `Updating character state: ${character.id} - ${action}${isChange ? '' : ' (no change)'}`
    );

    // Update tint and bounce effect
    if (action === 'idle') {
      if (character.activeTween) {
        character.activeTween.stop();
        character.activeTween = null;
      }
      character.sprite.setTint(this.INACTIVE_TINT);
      character.sprite.y = character.sprite.y - (character.sprite.y % 1); // Reset to pixel-perfect position
    } else {
      if (character.activeTween) {
        character.activeTween.stop();
      }
      character.sprite.setTint(this.ACTIVE_TINT);
      if (isChange) {
        this.createBounceTween(character);
      }
    }

    // Update thinking animation
    if (action.startsWith('thinking')) {
      if (!character.thinkingSprite) {
        this.createThinkingSprite(character, action);
      }
    } else if (character.thinkingSprite) {
      character.thinkingSprite.destroy();
      character.thinkingSprite = null;
    }
  }

  private createThinkingSprite(character: Character, action: CharacterAction): void {
    const thinkingSprite = this.scene.add.sprite(
      character.sprite.x,
      character.sprite.y + this.THINKING_OFFSET_Y,
      action
    );
    character.thinkingSprite = thinkingSprite;
    thinkingSprite.play(action);
  }

  private createBounceTween(character: Character): void {
    const originalY = character.sprite.y;
    character.activeTween = this.scene.tweens.add({
      targets: character.sprite,
      y: originalY - this.BOUNCE_HEIGHT,
      duration: this.BOUNCE_DURATION,
      ease: 'Quad.easeInOut',
      yoyo: true,
      repeat: -1,
    });
  }

  getCharacter(id: string): Character | undefined {
    return this.characters.get(id);
  }
}
