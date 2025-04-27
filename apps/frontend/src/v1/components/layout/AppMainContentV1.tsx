import type { SceneStateSnapshot } from '@pixeltales/contracts';
import ConversationHistory from '../ConversationHistory';
import SceneInfo from '../SceneInfo';

interface AppMainContentV1Props {
  sceneState: SceneStateSnapshot | null;
  isSideView: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
}

export function AppMainContentV1({
  sceneState,
  isSideView,
  setIsModalOpen,
}: AppMainContentV1Props) {
  return (
    <main className="p-2 sm:p-4 space-y-3 sm:space-y-6">
      {/* AppControls are rendered directly in App.tsx now */}

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
  );
}
