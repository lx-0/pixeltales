import type { Types } from 'phaser';
import { MainScene } from './MainScene';
import { UIScene } from './UIScene';

// Re-export pure constants from the Phaser-free module so existing
// `import { TILE_SIZE } from '@/game/config'` callers keep working.
export { GAME_HEIGHT, GAME_WIDTH, TILE_SIZE } from './constants';

import { GAME_HEIGHT, GAME_WIDTH } from './constants';

export const gameConfig: Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#87CEEB',
  pixelArt: true,
  roundPixels: true,
  scene: [MainScene, UIScene],
  scale: {
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
};
