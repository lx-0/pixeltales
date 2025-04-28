import { gameConfigV1 } from '@/v1/game/config';
import { socketV1Service } from '@/v1/services/socket';
import type { SceneStateSnapshot } from '@pixeltales/contracts';
import { Logger } from '@yesterday-ai/logger-frontend';
import React, { useEffect, useRef } from 'react';
import { GameInitializer } from './GameInitializer';

interface V1AppInitializerProps {
  onSceneState: (state: SceneStateSnapshot) => void;
  children: (gameRef: React.RefObject<Phaser.Game | null>) => React.ReactNode;
}

export function V1AppInitializer({ onSceneState, children }: V1AppInitializerProps) {
  const socketInitializedRef = useRef(false);

  useEffect(() => {
    if (!socketInitializedRef.current) {
      Logger.debug('V1AppInitializer', 'Initializing V1 socket connection...');
      socketV1Service.connect();
      socketInitializedRef.current = true;
    }

    const handleSceneState = (state: SceneStateSnapshot) => {
      onSceneState(state);
    };

    socketV1Service.addListener('scene_state', handleSceneState);

    return () => {
      socketV1Service.removeListener('scene_state', handleSceneState);
      Logger.info('V1AppInitializer', 'Cleaned up V1 listeners.');
    };
  }, [onSceneState]);

  return <GameInitializer gameConfig={gameConfigV1}>{children}</GameInitializer>;
}
