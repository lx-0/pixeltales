import { SpriteFrameLocation, SpritesheetStructure } from '@pixeltales/contracts';
import React from 'react';

export const addPathPrefix = (filename: string) => `/assets/characters/${filename}`;

/**
 * Simple function to get CSS for displaying a specific sprite frame
 */
export function getFrameStyle(
  structure: SpritesheetStructure,
  imagePath: string | number,
  scale = 1,
  frame?: SpriteFrameLocation,
): React.CSSProperties {
  const row = frame?.[0] ?? structure.baseSprite[0];
  const col = frame?.[1] ?? structure.baseSprite[1];

  const posX = col * structure.frameWidth;
  const posY = row * structure.frameHeight;

  return {
    width: `${structure.frameWidth * scale}px`,
    height: `${structure.frameHeight * scale}px`,
    backgroundImage: `url(${imagePath})`,
    backgroundPosition: `-${posX * scale}px -${posY * scale}px`,
    backgroundSize: `${structure.columns * structure.frameWidth * scale}px ${structure.rows * structure.frameHeight * scale}px`,
    imageRendering: 'pixelated',
  };
}
