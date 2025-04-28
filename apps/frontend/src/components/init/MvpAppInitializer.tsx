import { gameConfig } from '@/game/mvp-frankenstein/config';
import { debugSocketService } from '@/services/socket';
import type { AgentDebugEventBroadcast } from '@pixeltales/contracts';
import { Logger } from '@yesterday-ai/logger-frontend';
import React, { useEffect, useRef } from 'react';
import { GameInitializer } from './GameInitializer';

interface MvpAppInitializerProps {
  onEvent: (event: AgentDebugEventBroadcast) => void;
  children: (gameRef: React.RefObject<Phaser.Game | null>) => React.ReactNode;
}

export function MvpAppInitializer({ onEvent, children }: MvpAppInitializerProps) {
  const socketInitializedRef = useRef(false);

  useEffect(() => {
    let isMounted = true; // Track mount status for async operations
    Logger.debug('MvpAppInitializer', 'useEffect - Running setup...');

    if (!socketInitializedRef.current) {
      Logger.debug('MvpAppInitializer', 'Initializing debug socket connection...');
      debugSocketService.connect();
      socketInitializedRef.current = true;
    }

    // Define the handler within the effect scope
    const handleAgentEvent = (event: AgentDebugEventBroadcast) => {
      if (isMounted) {
        // Ensure component is still mounted when event arrives
        Logger.info('MvpAppInitializer', 'Received agent_event', { type: event.type });
        onEvent(event);
      }
    };

    Logger.debug('MvpAppInitializer', 'Adding listener for agent_event');
    debugSocketService.addListener('agent_event', handleAgentEvent);

    // Cleanup function
    return () => {
      isMounted = false;
      debugSocketService.removeListener('agent_event', handleAgentEvent);
      // We don't necessarily disconnect the shared socket service here
      Logger.info('MvpAppInitializer', 'Cleaned up MVP listeners.');
    };
  }, [onEvent]);

  return <GameInitializer gameConfig={gameConfig}>{children}</GameInitializer>;
}
