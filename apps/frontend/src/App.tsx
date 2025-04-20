import type { SceneStateSnapshot } from '@pixeltales/contracts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Game } from 'phaser';
import { useEffect, useRef, useState } from 'react';
import { AppControls } from './components/layout/AppControls';
import { AppFooter } from './components/layout/AppFooter';
import { AppHeader } from './components/layout/AppHeader';
import { AppMainContent } from './components/layout/AppMainContent';
import { gameConfig } from './game/config';
import { useAuth } from './hooks/use-auth';
import { useSound } from './hooks/use-sound';
import { useViewMode } from './hooks/use-view-mode';
import { socketService } from './services/socket';
import { Logger } from './utils/logger';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

export default function App() {
  const gameRef = useRef<Game | null>(null);
  const socketInitializedRef = useRef(false);
  const [sceneState, setSceneState] = useState<SceneStateSnapshot | null>(null);
  const { viewMode: _viewMode, toggleViewMode, isSideView } = useViewMode();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, loading } = useAuth();
  const { isSoundEnabled, toggleSound } = useSound();

  // Debug: Log auth state received by App component
  useEffect(() => {
    Logger.debug('App', 'Auth state in component:', { loading, userId: user?.id });
  }, [loading, user]);

  // Initialize game and socket
  useEffect(() => {
    if (!gameRef.current) {
      gameRef.current = new Game(gameConfig);
    }

    if (!socketInitializedRef.current) {
      Logger.debug('App', 'Initializing socket connection...');
      socketService.connect();
      socketInitializedRef.current = true;
    }

    const handleSceneState = (state: SceneStateSnapshot) => {
      setSceneState(state);
    };

    // Purpose: Listen for state updates to update React UI components (e.g., ConversationHistory, SceneInfo).
    socketService.addListener('scene_state', handleSceneState);

    return () => {
      socketService.removeListener('scene_state', handleSceneState);
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  // Handle modal state changes
  useEffect(() => {
    const game = gameRef.current;
    if (!game) return;

    const event = isModalOpen ? 'modalOpen' : 'modalClose';
    Logger.debug('App', `Emitting ${event} event to scenes`);

    // Get scenes if they exist
    const mainScene = game.scene.getScene('MainScene');
    const uiScene = game.scene.getScene('UIScene');

    // Emit to scenes that exist
    if (mainScene?.events) {
      mainScene.events.emit(event);
    }
    if (uiScene?.events) {
      uiScene.events.emit(event);
    }
  }, [isModalOpen]);

  // Handle sound toggle with current game reference
  const handleSoundToggle = () => {
    toggleSound(gameRef.current);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-900 text-white">
        <AppHeader />
        <AppControls
          user={user}
          loading={loading}
          isSoundEnabled={isSoundEnabled}
          handleSoundToggle={handleSoundToggle}
          toggleViewMode={toggleViewMode}
          setIsModalOpen={setIsModalOpen}
        />
        <AppMainContent
          sceneState={sceneState}
          isSideView={isSideView}
          setIsModalOpen={setIsModalOpen}
        />
        <AppFooter />
      </div>
    </QueryClientProvider>
  );
}
