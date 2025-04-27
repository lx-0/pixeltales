// Placeholder data structure - replace with actual event data later
interface AgentMindVizProps {
  lastEventType?: string;
  lastPayload?: unknown;
}

/**
 * Basic placeholder component for visualizing Agent Mind subsystems.
 * Inspired by blueprint Section 3.7.
 * MVP: Just shows static layout and maybe last received event type.
 */
export function AgentMindViz({ lastEventType, lastPayload }: AgentMindVizProps) {
  // Define subsystem areas (could be more complex later with positioning/styling)
  const subsystems = [
    'Perceptual System',
    'System Systems', // Placeholder name from image
    'Reasoning Systems (Cycle)',
    'Goal & Utility',
    'Memory Systems',
    'Learning System',
  ];

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 h-full flex flex-col">
      <h2 className="text-lg font-bold mb-3 text-center text-yellow-400">
        AGENT'S MIND (MVP Proto)
      </h2>
      <div className="flex-grow grid grid-cols-2 gap-3 text-xs">
        {/* Render subsystem boxes */}
        {subsystems.map((name) => (
          <div
            key={name}
            className={`border p-2 rounded flex items-center justify-center text-center bg-gray-700 border-gray-600`}
          >
            {name}
          </div>
        ))}
      </div>
      <div className="mt-3 pt-2 border-t border-gray-600 text-xs">
        <p className="font-semibold">Last Event:</p>
        <p className="text-gray-400 truncate">{lastEventType ?? 'N/A'}</p>
        {/* <pre className="text-xs text-gray-500 overflow-auto max-h-20">
          {JSON.stringify(lastPayload, null, 2) ?? ''}
        </pre> */}
      </div>
    </div>
  );
}
