/**
 * Pure constants safe to import from non-Phaser code (forms, hooks,
 * tests in jsdom). Importing `@/game/config` instead pulls in Phaser
 * via MainScene/UIScene, which fails outside a browser/canvas runtime.
 */

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
export const TILE_SIZE = 48;
