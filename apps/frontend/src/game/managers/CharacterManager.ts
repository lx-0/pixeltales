import { Logger } from '@/utils/logger';
import type {
  CharacterAction,
  CharacterState,
  SceneStateSnapshotState,
} from '@pixeltales/contracts';
import { Scene } from 'phaser';
import { TILE_SIZE } from '../config';

// Temporary type augmentation until contracts are updated
type CharacterStateWithSpriteKey = CharacterState & { spritesheet_key?: string };

interface Character {
  id: string;
  state: CharacterState;
  keyUsed: string; // Store the actual key used for sprite/animation
  sprite: Phaser.GameObjects.Sprite;
  activeTween: Phaser.Tweens.Tween | null;
  thinkingSprite: Phaser.GameObjects.Sprite | null;
  color?: string; // Optional color property for character styling
}

export class CharacterManager {
  private readonly ACTIVE_TINT = 0xffffff;
  private readonly INACTIVE_TINT = 0xaaaaaa;
  private readonly BOUNCE_DURATION = 300; // ms
  private readonly BOUNCE_HEIGHT = 8; // pixels
  private readonly THINKING_OFFSET_Y = -60; // pixels above character

  private characters: Map<string, Character> = new Map();
  private animationsCreated = false;

  constructor(private scene: Scene) {}

  preload(): void {
    // Load character sprites (48x96 because each frame uses two vertical tiles)
    this.scene.load.spritesheet('bob', '/assets/characters/Bob_idle_anim_48x48.png', {
      frameWidth: TILE_SIZE,
      frameHeight: TILE_SIZE * 2,
      startFrame: 0,
      endFrame: 23,
    });

    this.scene.load.spritesheet('alice', '/assets/characters/Cleaner_girl_idle_anim_48x48.png', {
      frameWidth: TILE_SIZE,
      frameHeight: TILE_SIZE * 2,
      startFrame: 0,
      endFrame: 23,
    });

    // Load thinking animation spritesheet
    this.scene.load.spritesheet('thinking', '/assets/ui/ui_thinking_48x96.png', {
      frameWidth: TILE_SIZE,
      frameHeight: TILE_SIZE * 2,
      startFrame: 0,
      endFrame: 9,
    });
  }

  create(): void {
    // Don't create default animations automatically here anymore
    // They will be created on demand when a character needs them
    // if (!this.animationsCreated) {
    //   this.createAnimations();
    // }
    this.setupEventListeners(); // Keep listener setup
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
      `Handling historyModeChange event with isInHistoryMode: ${isInHistoryMode}`,
    );
    if (isInHistoryMode) {
      this.clearCharactersAnimations();
    }
  }

  private createAnimations(spritesheetKey?: string): void {
    if (spritesheetKey) {
      // Create animations for a specific key
      Logger.info(this.constructor.name, `Creating animations for: ${spritesheetKey}`);
      const directions = ['right', 'back', 'left', 'front'] as const;

      if (!this.scene.textures.exists(spritesheetKey)) {
        Logger.error(this.constructor.name, `Texture key does not exist: ${spritesheetKey}`);
        return;
      }

      // Basic validation assuming 4x6 layout (can be made more robust)
      const texture = this.scene.textures.get(spritesheetKey);
      const totalFrames = texture.getFrameNames(false).length;
      const framesPerDirection = 6;
      if (totalFrames < directions.length * framesPerDirection) {
        Logger.warn(
          this.constructor.name,
          `Spritesheet ${spritesheetKey} has insufficient frames (${totalFrames}).`,
        );
        // Potentially create a single-frame fallback? For now, just log.
        return;
      }

      directions.forEach((dir, index) => {
        const animKey = `${spritesheetKey}_idle_${dir}`;
        if (!this.scene.anims.exists(animKey)) {
          const startFrame = index * framesPerDirection;
          const endFrame = startFrame + framesPerDirection - 1;
          if (startFrame >= totalFrames || endFrame >= totalFrames) {
            Logger.error(
              this.constructor.name,
              `Invalid frame range [${startFrame}-${endFrame}] for ${spritesheetKey}`,
            );
            return;
          }
          Logger.debug(this.constructor.name, `Creating anim: ${animKey}`);
          this.scene.anims.create({
            key: animKey,
            frames: this.scene.anims.generateFrameNumbers(spritesheetKey, {
              start: startFrame,
              end: endFrame,
            }),
            frameRate: 8,
            repeat: -1,
          });
        }
      });
    } else if (!this.animationsCreated) {
      // --- Original Default Animation Logic ---
      Logger.info(this.constructor.name, 'Creating DEFAULT character animations (bob, alice)');
      const directions = ['right', 'back', 'left', 'front'] as const;
      const characters = ['bob', 'alice'] as const; // Default characters

      characters.forEach((char) => {
        directions.forEach((dir, index) => {
          const animKey = `${char}_idle_${dir}`;
          if (!this.scene.anims.exists(animKey)) {
            Logger.debug(this.constructor.name, `Creating anim: ${animKey}`);
            this.scene.anims.create({
              key: animKey,
              frames: this.scene.anims.generateFrameNumbers(char, {
                start: index * 6,
                end: index * 6 + 5,
              }),
              frameRate: 8,
              repeat: -1,
            });
          }
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
      this.animationsCreated = true; // Mark defaults as created
    }
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

  updateCharacters(state: SceneStateSnapshotState): void {
    Object.entries(state.characters).forEach(([id, charData]) => {
      let character = this.characters.get(id);
      const charDataWithKey = charData as CharacterStateWithSpriteKey;
      const keyToUse = charDataWithKey.spritesheet_key || id; // Use spritesheet_key if available, else id

      // Ensure default animations are created if needed (for thinking, bob, alice)
      this.createAnimations();
      // Ensure specific animations are created if a key was provided
      if (charDataWithKey.spritesheet_key) {
        this.createAnimations(charDataWithKey.spritesheet_key);
      }

      if (!character) {
        // Create new character if it doesn't exist
        Logger.info(this.constructor.name, `Creating character ${id} using key: ${keyToUse}`);
        const sprite = this.scene.add.sprite(charData.position.x, charData.position.y, keyToUse);

        if (!sprite.texture.key || sprite.texture.key === '__MISSING') {
          Logger.error(
            this.constructor.name,
            `Failed to create sprite for ${id}. Texture key "${keyToUse}" invalid or not loaded.`,
          );
          sprite.destroy();
          return; // Skip this character
        }

        character = {
          id,
          state: charData,
          keyUsed: keyToUse, // Store the key we actually used
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

      // Check if key changed (might happen if state updates mid-creation)
      if (character.keyUsed !== keyToUse) {
        Logger.warn(
          this.constructor.name,
          `Key changed for ${id} from ${character.keyUsed} to ${keyToUse}. Recreating sprite.`,
        );
        character.sprite.destroy();
        character.sprite = this.scene.add.sprite(
          charData.position.x,
          charData.position.y,
          keyToUse,
        );
        character.keyUsed = keyToUse;
        if (character.activeTween) character.activeTween.stop();
        if (character.thinkingSprite) character.thinkingSprite.destroy();
        character.activeTween = null;
        character.thinkingSprite = null;
        // Re-trigger animation creation for the new key if needed
        this.createAnimations(keyToUse);
      }

      // Update character position and animation
      character.sprite.setPosition(charData.position.x, charData.position.y);
      const animKey = `${character.keyUsed}_idle_${charData.direction}`;
      if (this.scene.anims.exists(animKey)) {
        character.sprite.play(animKey, true);
      } else {
        Logger.warn(
          this.constructor.name,
          `Anim key ${animKey} missing for ${id}. Setting frame 0.`,
        );
        if (character.sprite.texture.key !== '__MISSING') {
          character.sprite.setFrame(0); // Fallback
        }
      }

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
      `Updating character state: ${character.id} - ${action}${isChange ? '' : ' (no change)'}`,
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
        // Use the specific action name (e.g., 'thinking') for animation key
        // but ensure the sprite uses the 'thinking' texture key
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
      'thinking', // Always use 'thinking' texture key for the sprite
    );
    character.thinkingSprite = thinkingSprite;
    thinkingSprite.play(action); // Play the specific thinking animation (e.g., 'thinking')
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
