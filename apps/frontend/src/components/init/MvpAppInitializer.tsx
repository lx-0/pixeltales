import { gameConfig } from '@/game/mvp-frankenstein/config';
import { debugSocketService } from '@/services/socket';
import { Logger } from '@/utils/logger';
import type { AgentDebugEventBroadcast } from '@pixeltales/contracts';
import React, { useEffect, useRef } from 'react';
import { GameInitializer } from './GameInitializer';

interface MvpAppInitializerProps {
  onEvent: (event: AgentDebugEventBroadcast) => void;
  children: (gameRef: React.RefObject<Phaser.Game | null>) => React.ReactNode;
}

export function MvpAppInitializer({ onEvent, children }: MvpAppInitializerProps) {
  const socketInitializedRef = useRef(false);

  useEffect(() => {
    if (!socketInitializedRef.current) {
      Logger.debug('MvpAppInitializer', 'Initializing debug socket connection...');
      debugSocketService.connect();
      socketInitializedRef.current = true;
    }

    const handleAgentEvent = (event: AgentDebugEventBroadcast) => {
      onEvent(event);
    };

    debugSocketService.addListener('agent_event', handleAgentEvent);

    return () => {
      debugSocketService.removeListener('agent_event', handleAgentEvent);
      Logger.info('MvpAppInitializer', 'Cleaned up MVP listeners.');
    };
  }, [onEvent]);

  return <GameInitializer gameConfig={gameConfig}>{children}</GameInitializer>;
}
