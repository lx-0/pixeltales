import { Logger } from '@yesterday-ai/logger-frontend';
import { Game } from 'phaser';
import React, { useEffect, useRef } from 'react';

interface GameInitializerProps {
  gameConfig: Phaser.Types.Core.GameConfig;
  children: (gameRef: React.RefObject<Game | null>) => React.ReactNode;
}

export function GameInitializer({ children, gameConfig }: GameInitializerProps) {
  const gameRef = useRef<Game | null>(null);

  useEffect(() => {
    if (!gameRef.current) {
      Logger.info(
        'GameInitializer',
        `Initializing Phaser with scenes: ${
          Array.isArray(gameConfig.scene)
            ? gameConfig.scene.map((s) => (typeof s === 'function' ? s.name : String(s))).join(', ')
            : 'N/A'
        }`,
      );
      gameRef.current = new Game(gameConfig);
    }

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
      Logger.info('GameInitializer', 'Phaser game instance destroyed.');
    };
  }, [gameConfig]);

  // Execute the function child, passing the ref
  const renderedChildren = children(gameRef);
  return <>{renderedChildren}</>;
}
