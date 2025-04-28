import { useAuth } from '@/lib/auth';
import type { AgentDebugEventBroadcast, SceneStateSnapshot } from '@pixeltales/contracts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Logger } from '@yesterday-ai/logger-frontend';
import { useEffect, useRef, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { MvpAppInitializer } from './components/init/MvpAppInitializer';
import { V1AppInitializer } from './components/init/V1AppInitializer';
import { AppControls } from './components/layout/AppControls';
import { AppFooter } from './components/layout/AppFooter';
import { AppHeader } from './components/layout/AppHeader';
import { AppMainContent } from './components/layout/AppMainContent';
import { useSound } from './hooks/use-sound';
import { useViewMode } from './hooks/use-view-mode';
import { AppControlsV1 } from './v1/components/layout/AppControlsV1';
import { AppMainContentV1 } from './v1/components/layout/AppMainContentV1';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Define a type for a Phaser Scene class constructor
// type SceneClassConstructor = new (...args: any[]) => Phaser.Scene; // Reverted

// --- Main App Component ---

export default function App() {
  const [sceneState, setSceneState] = useState<SceneStateSnapshot | null>(null);
  const [lastAgentEvent, setLastAgentEvent] = useState<AgentDebugEventBroadcast | null>(null);
  const { toggleViewMode, isSideView } = useViewMode();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, loading } = useAuth();
  const { isSoundEnabled, toggleSound } = useSound();
  const currentGameRef = useRef<Phaser.Game | null>(null);

  // Debug: Log auth state received by App component
  useEffect(() => {
    Logger.debug('App', 'Auth state in component:', { loading, userId: user?.id });
  }, [loading, user]);

  // Handle modal state changes
  useEffect(() => {
    const game = currentGameRef.current;
    if (!game) return;

    const event = isModalOpen ? 'modalOpen' : 'modalClose';
    Logger.debug('App', `Emitting ${event} event to scenes`);

    // Emit to ALL active scenes (more robust than hardcoding names)
    game.scene.getScenes(true).forEach((scene) => {
      scene.events.emit(event);
    });
  }, [isModalOpen]);

  // Handle sound toggle with current game reference
  const handleSoundToggle = () => {
    toggleSound(currentGameRef.current);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-900 text-white">
        <AppHeader />
        <Routes>
          <Route
            path="/"
            element={
              <MvpAppInitializer onEvent={setLastAgentEvent}>
                {(gameRef) => {
                  currentGameRef.current = gameRef.current;
                  return (
                    <>
                      <AppControls
                        user={user}
                        loading={loading}
                        isSoundEnabled={isSoundEnabled}
                        handleSoundToggle={handleSoundToggle}
                        toggleViewMode={toggleViewMode}
                      />
                      <AppMainContent
                        isSideView={isSideView}
                        setIsModalOpen={setIsModalOpen}
                        lastAgentEvent={lastAgentEvent}
                      />
                    </>
                  );
                }}
              </MvpAppInitializer>
            }
          />
          <Route
            path="/v1"
            element={
              <V1AppInitializer onSceneState={setSceneState}>
                {(gameRef) => {
                  currentGameRef.current = gameRef.current;
                  return (
                    <>
                      <AppControls
                        user={user}
                        loading={loading}
                        isSoundEnabled={isSoundEnabled}
                        handleSoundToggle={handleSoundToggle}
                        toggleViewMode={toggleViewMode}
                      >
                        <AppControlsV1 setIsModalOpen={setIsModalOpen} />
                      </AppControls>
                      <AppMainContentV1
                        sceneState={sceneState}
                        isSideView={isSideView}
                        setIsModalOpen={setIsModalOpen}
                      />
                    </>
                  );
                }}
              </V1AppInitializer>
            }
          />
        </Routes>
        <AppFooter />
      </div>
    </QueryClientProvider>
  );
}
