import { Button } from '@/lib/shadcn-ui/button';
import { SiGithub } from '@icons-pack/react-simple-icons';
import type { SceneStateSnapshotState } from '@pixeltales/contracts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout, Volume2, VolumeX } from 'lucide-react';
import { Game } from 'phaser';
import { useEffect, useRef, useState } from 'react';
import LoginButton from './components/auth/LoginButton';
import UserAvatar from './components/auth/UserAvatar';
import ConversationHistory from './components/ConversationHistory';
import SceneInfo from './components/SceneInfo';
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
  const [sceneState, setSceneState] = useState<SceneStateSnapshotState | null>(null);
  const { viewMode: _viewMode, toggleViewMode, isSideView } = useViewMode();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, loading } = useAuth();
  const { isSoundEnabled, toggleSound } = useSound();

  // Initialize game and socket
  useEffect(() => {
    if (!gameRef.current) {
      gameRef.current = new Game(gameConfig);
    }

    if (!socketInitializedRef.current) {
      Logger.info('App.tsx:App()', 'Initializing socket connection...');
      socketService.connect();
      socketInitializedRef.current = true;
    }

    const handleSceneState = (state: SceneStateSnapshotState) => {
      setSceneState(state);
    };

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
        <header className="p-2 sm:p-4 bg-gray-800 border-b border-gray-700">
          <div className="mx-auto">
            <h1 className="text-xl sm:text-2xl font-bold">PixelTales</h1>
            <p className="text-sm sm:text-base text-gray-400">
              Where AI Characters Tell Their Stories
            </p>
          </div>
        </header>

        <main className="p-2 sm:p-4 space-y-3 sm:space-y-6">
          {/* Control Buttons */}
          <div className="fixed top-2 right-2 sm:top-6 sm:right-4 z-50 flex gap-2">
            {/* User Avatar / Login Button */}
            <div className="flex items-center gap-2 z-10">
              {!loading && (user ? <UserAvatar /> : <LoginButton />)}
            </div>

            {/* Sound Toggle Button */}
            <Button
              variant="secondary"
              size="icon"
              className="text-white bg-gray-700 hover:bg-gray-600"
              onClick={handleSoundToggle}
              title={isSoundEnabled ? 'Disable Sound' : 'Enable Sound'}
            >
              {isSoundEnabled ? (
                <Volume2 className="h-[1.2rem] w-[1.2rem]" />
              ) : (
                <VolumeX className="h-[1.2rem] w-[1.2rem]" />
              )}
              <span className="sr-only">{isSoundEnabled ? 'Disable Sound' : 'Enable Sound'}</span>
            </Button>

            {/* View Mode Toggle Button */}
            <Button
              variant="secondary"
              size="icon"
              className="text-white bg-gray-700 hover:bg-gray-600"
              onClick={toggleViewMode}
            >
              <Layout className="h-[1.2rem] w-[1.2rem]" />
              <span className="sr-only">Toggle View Mode</span>
            </Button>
          </div>

          {/* Flexible Layout Container */}
          <div
            className={`grid gap-2 sm:gap-4 mx-auto h-auto sm:grid-cols-1 ${
              isSideView ? `lg:grid-cols-[1fr_400px]` : 'grid-cols-1'
            }`}
          >
            {/* Game Container */}
            <div
              className="aspect-[4/3] overflow-hidden bg-gray-800 rounded-lg shadow-lg border border-gray-700"
              id="game-container"
            />

            {/* Conversation History (Side View Only) */}
            {sceneState && isSideView && (
              <ConversationHistory
                scene={sceneState}
                isSideView={isSideView}
                setIsModalOpen={setIsModalOpen}
              />
            )}
          </div>

          {/* Scene Info and Characters */}
          {sceneState && (
            <div className="mx-auto w-full">
              <SceneInfo scene={sceneState} setIsModalOpen={setIsModalOpen} />
            </div>
          )}

          {/* Conversation History (Bottom View Only) */}
          {sceneState && !isSideView && (
            <div className="mx-auto w-full">
              <ConversationHistory
                scene={sceneState}
                isSideView={isSideView}
                setIsModalOpen={setIsModalOpen}
              />
            </div>
          )}

          <div className="bg-gray-800 rounded-lg p-2 sm:p-4 mx-auto w-full border border-gray-700">
            <h2 className="text-lg sm:text-xl font-bold mb-2">About</h2>
            <p className="text-sm sm:text-base text-gray-400">
              Watch as AI characters engage in endless conversations, each with their own unique
              personality and story to tell.
            </p>
          </div>
        </main>

        <footer className="p-2 sm:p-4 bg-gray-800 mt-3 sm:mt-6 border-t border-gray-700">
          <div className="mx-auto w-full">
            <p className="text-center text-gray-400 text-xs sm:text-sm">
              © 2024 PixelTales - An AI Character Interaction Experiment
            </p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <a
                href="https://github.com/lx-0/pixeltales"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="GitHub Repository"
              >
                <SiGithub size={18} className="sm:w-5 sm:h-5" />
              </a>
              <span className="text-gray-400 text-xs sm:text-sm">
                Created by
                <a
                  href="https://github.com/lx-0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 hover:text-white transition-colors"
                >
                  @lx-0
                </a>
              </span>
            </div>
          </div>
        </footer>
      </div>
    </QueryClientProvider>
  );
}
