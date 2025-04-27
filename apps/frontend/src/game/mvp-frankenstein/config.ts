import { Types } from 'phaser';
import { FrankensteinScene } from './FrankensteinScene';
import { FrankensteinUIScene } from './FrankensteinUIScene';

export const GAME_WIDTH = 864; // 768
export const GAME_HEIGHT = 672; // 576
export const TILE_SIZE = 48;

export const gameConfig: Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#87CEEB',
  pixelArt: true,
  roundPixels: true,
  scene: [FrankensteinScene, FrankensteinUIScene],
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
