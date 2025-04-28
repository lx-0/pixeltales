import type { AgentDebugEventBroadcast } from '@pixeltales/contracts';
import { AgentMindViz } from '../debug/AgentMindViz';

interface AppMainContentProps {
  isSideView: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  lastAgentEvent?: AgentDebugEventBroadcast | null;
}

export function AppMainContent({
  isSideView,
  setIsModalOpen,
  lastAgentEvent,
}: AppMainContentProps) {
  return (
    <main className="p-2 sm:p-4 space-y-3 sm:space-y-6">
      {/* Layout Container */}
      {
        // --- Frankenstein MVP Layout ---
        <div className={`grid gap-2 sm:gap-4 mx-auto h-auto grid-cols-1 lg:grid-cols-[1fr_300px]`}>
          <div
            className="aspect-[4/3] overflow-hidden bg-gray-800 rounded-lg shadow-lg border border-gray-700"
            id="game-container"
          />
          {/* Agent Mind Viz Panel */}
          <div className="h-full">
            <AgentMindViz
              lastEventType={lastAgentEvent?.type}
              lastPayload={lastAgentEvent?.payload}
            />
          </div>
        </div>
      }

      <div className="bg-gray-800 rounded-lg p-2 sm:p-4 mx-auto w-full border border-gray-700">
        <h2 className="text-lg sm:text-xl font-bold mb-2">About</h2>
        <p className="text-sm sm:text-base text-gray-400">
          This is a prototype for a cognitive simulation platform. Current Game Cartridge:
          Frankenstein MVP - Single Agent, no Capabilities, very basic Perceiption, just core vital
          Functions, Loop, Basic Agentic Architecture and Event Bus and Core Instrumentation
          integration. Core Memories. Integration with UI, Reporting, Evaluations etc.
        </p>
      </div>
    </main>
  );
}
