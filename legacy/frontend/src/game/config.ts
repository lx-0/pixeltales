import { Types } from 'phaser';
import { MainScene } from './MainScene';
import { UIScene } from './UIScene';

export const GAME_WIDTH = 800; // 768
export const GAME_HEIGHT = 600; // 576
export const TILE_SIZE = 48;

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
