import { SiGithub } from '@icons-pack/react-simple-icons';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from 'lucide-react';
import { Game } from 'phaser';
import { useEffect, useRef, useState } from 'react';
import ConversationHistory from '@/components/organisms/ConversationHistory';
import SceneInfo from '@/components/organisms/SceneInfo';
import { Button } from '@/components/ui/button';
import type { SceneState } from '@/types/scene';
import { gameConfig } from './game/config';
import type { MainSceneInitData } from './game/MainScene';
import { useConfig } from './hooks/use-config';
import { useScene } from './hooks/use-scenes';
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
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell />
    </QueryClientProvider>
  );
}

function AppShell() {
  const gameRef = useRef<Game | null>(null);
  const startedConfigIdRef = useRef<number | null>(null);
  const socketInitializedRef = useRef(false);
  const [sceneState, setSceneState] = useState<SceneState | null>(null);
  const { viewMode: _viewMode, toggleViewMode, isSideView } = useViewMode();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: catalog } = useConfig();
  // Wait for the first scene_state to learn which scene config is active,
  // then fetch its full SceneConfig (sprite_id / room_id live there).
  const activeSceneConfigId = sceneState?.scene_config_id ?? null;
  const { data: activeSceneConfig } = useScene(activeSceneConfigId);

  // Connect socket + create the Phaser Game shell once.
  useEffect(() => {
    if (!gameRef.current) {
      gameRef.current = new Game(gameConfig);
    }

    if (!socketInitializedRef.current) {
      Logger.info('App.tsx:AppShell()', 'Initializing socket connection...');
      socketService.connect();
      socketInitializedRef.current = true;
    }

    const handleSceneState = (state: SceneState) => {
      setSceneState(state);
    };

    socketService.addListener('scene_state', handleSceneState);

    return () => {
      socketService.removeListener('scene_state', handleSceneState);
      gameRef.current?.destroy(true);
      gameRef.current = null;
      startedConfigIdRef.current = null;
    };
  }, []);

  // Start (or restart) MainScene once the catalog + active scene config
  // are loaded. If the active scene_config_id changes (new active scene
  // proposal), tear MainScene down and restart with the fresh config.
  useEffect(() => {
    const game = gameRef.current;
    if (!game || !catalog || !activeSceneConfig) return;

    if (startedConfigIdRef.current === activeSceneConfig.id) return;

    const initData: MainSceneInitData = { catalog, sceneConfig: activeSceneConfig };

    if (startedConfigIdRef.current !== null && game.scene.getScene('MainScene')) {
      Logger.info('AppShell', `Restarting MainScene for scene_config_id ${activeSceneConfig.id}`);
      game.scene.stop('MainScene');
    } else {
      Logger.info('AppShell', `Starting MainScene for scene_config_id ${activeSceneConfig.id}`);
    }
    game.scene.start('MainScene', initData);
    startedConfigIdRef.current = activeSceneConfig.id;
  }, [catalog, activeSceneConfig]);

  // Handle modal state changes
  useEffect(() => {
    const game = gameRef.current;
    if (!game) return;

    const event = isModalOpen ? 'modalOpen' : 'modalClose';
    Logger.debug('AppShell', `Emitting ${event} event to scenes`);

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

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="p-2 sm:p-4 bg-gray-800">
        <div className="mx-auto">
          <h1 className="text-xl sm:text-2xl font-bold">PixelTales</h1>
          <p className="text-sm sm:text-base text-gray-400">
            Where AI Characters Tell Their Stories
          </p>
        </div>
      </header>

      <main className="p-2 sm:p-4 space-y-3 sm:space-y-6">
        {/* View Mode Toggle Button */}
        <Button
          variant="secondary"
          size="icon"
          className="fixed top-2 right-2 sm:top-4 sm:right-4 z-50 text-white bg-gray-700 hover:bg-gray-600"
          onClick={toggleViewMode}
        >
          <Layout className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Toggle View Mode</span>
        </Button>

        {/* Flexible Layout Container */}
        <div
          className={`grid gap-2 sm:gap-4 mx-auto h-auto sm:grid-cols-1 ${
            isSideView ? `lg:grid-cols-[1fr_400px]` : 'grid-cols-1'
          }`}
        >
          {/* Game Container */}
          <div
            className="aspect-[4/3] overflow-hidden bg-gray-800 rounded-lg shadow-lg"
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

        <div className="bg-gray-800 rounded-lg p-2 sm:p-4 mx-auto w-full">
          <h2 className="text-lg sm:text-xl font-bold mb-2">About</h2>
          <p className="text-sm sm:text-base text-gray-400">
            Watch as AI characters engage in endless conversations, each with their own unique
            personality and story to tell.
          </p>
        </div>
      </main>

      <footer className="p-2 sm:p-4 bg-gray-800 mt-3 sm:mt-6">
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
  );
}
