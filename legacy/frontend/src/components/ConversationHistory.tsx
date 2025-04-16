import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAutoScroll } from '../hooks/use-auto-scroll';
import type { SceneState } from '../types/scene';
import { SceneProposalForm } from './SceneProposalForm';
import { Button } from './ui/button';

interface ConversationHistoryProps {
  scene: SceneState;
  isSideView: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
}

const formatTime = (timestamp: number): string => {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatCountdown = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function ConversationHistory({
  scene,
  isSideView,
  setIsModalOpen,
}: ConversationHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(isSideView);
  const [countdown, setCountdown] = useState<number>(0);
  const conversationRef = useAutoScroll<HTMLDivElement>([
    scene.messages,
    scene.conversation_ended,
  ]);

  // Update expansion state when view mode changes
  useEffect(() => {
    setIsExpanded(isSideView);
  }, [isSideView]);

  // Handle countdown timer
  useEffect(() => {
    if (!scene.conversation_ended || !scene.ended_at) return;

    const cooldownPeriod = 600; // 10 minutes in seconds
    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      const elapsed = now - (scene.ended_at ?? 0);
      const remaining = cooldownPeriod - elapsed;
      setCountdown(remaining > 0 ? remaining : 0);
    };

    // Initial update
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [scene.conversation_ended, scene.ended_at]);

  // Calculate progress percentage
  const getProgressPercentage = (current: number, total: number): number => {
    return Math.max(0, Math.min(100, (current / total) * 100));
  };

  return (
    <div
      className={`h-full flex flex-col bg-gray-800 rounded-lg shadow-lg border border-gray-700 w-full min-w-0`}
    >
      <div className="p-2 sm:p-4 flex items-center justify-between flex-shrink-0 border-b border-gray-700">
        <h2 className="text-lg sm:text-xl font-bold text-gray-100">
          Conversation History
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-white -mr-2"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <ChevronDown
            className={`h-5 w-5 sm:h-6 sm:w-6 transform transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
          <span className="sr-only">
            {isExpanded ? 'Collapse' : 'Expand'} Conversation History
          </span>
        </Button>
      </div>
      {isExpanded && (
        <div
          ref={conversationRef}
          className={`flex-grow p-2 sm:p-4 space-y-2 sm:space-y-3 overflow-y-auto overflow-x-hidden w-full min-w-0`}
          style={{ height: '400px', maxHeight: '100%' }} // Respect parent height
        >
          {scene.messages.map((message, index) => {
            const character = scene.characters[message.character];
            const isLastMessage = index === scene.messages.length - 1;
            const isSecondLastMessage = index === scene.messages.length - 2;
            const nextMessage = isLastMessage
              ? null
              : scene.messages[index + 1];
            const nextMessageCharacter = nextMessage
              ? scene.characters[nextMessage.character]
              : null;
            return (
              <div
                key={`${index}-${scene.conversation_ended}`}
                className={`p-2 sm:p-3 rounded-lg bg-gray-700 relative text-sm sm:text-base ${
                  isLastMessage &&
                  character.action === 'speaking' &&
                  !scene.conversation_ended
                    ? 'animate-pulse'
                    : ''
                }`}
                style={{ borderLeft: `4px solid ${character.color}` }}
              >
                <div className="flex items-center justify-between gap-2 cursor-default absolute sm:top-1 -top-1 sm:right-3 right-2 text-[10px] sm:text-xs text-gray-500">
                  {/* <span title="Model used for this character">
                      {character.llm_config.model_name}
                    </span>
                    <span title="Temperature used for this character">
                      {character.llm_config.temperature}
                    </span> */}
                  <span title="Message number in the conversation">
                    #{index + 1}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 cursor-default mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-bold"
                      style={{ color: character.color }}
                    >
                      {character.name}
                    </span>
                    {message.mood && (
                      <span className="text-xs sm:text-sm text-gray-400 items-center">
                        <span title={`Current mood of ${character.name}`}>
                          {message.mood_emoji} {message.mood}
                        </span>

                        {message.conversation_rating !== null && (
                          <span
                            className="text-[10px] sm:text-xs"
                            title={`${character.name}'s rating of the conversation so far`}
                          >
                            {' '}
                            ({message.conversation_rating}/10)
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-400">
                    {formatTime(Number(message.unix_timestamp))}
                  </span>
                </div>

                {message.thoughts && (
                  <div className="text-gray-400 italic text-xs sm:text-sm border-l-2 border-gray-400 pl-2 mb-4">
                    {message.thoughts}
                  </div>
                )}

                {message.recipient && (
                  <div className="text-gray-400 text-sm break-words whitespace-normal leading-5 mb-1">
                    @{message.recipient.replace(/ /g, '_')}
                  </div>
                )}

                <div className="text-gray-300 text-sm sm:text-base">
                  {message.content}
                </div>

                {message.end_conversation && (
                  <div
                    className="mt-2 text-xs text-center italic text-gray-400"
                    style={
                      ((character.end_conversation_requested_at ?? 0) +
                        (character.end_conversation_requested_validity_duration ??
                          0)) *
                        1000 >
                      Date.now()
                        ? { color: character.color }
                        : {}
                    }
                  >
                    {character.name} requested to end the conversation
                  </div>
                )}

                {nextMessage?.reaction_on_previous_message !== undefined &&
                  nextMessage?.reaction_on_previous_message !== null && (
                    <span
                      title={`Reaction of ${
                        nextMessageCharacter?.name ?? 'unknown'
                      }`}
                      className={`absolute bottom-1 right-8 translate-y-1/2 translate-x-1/2 text-sm bg-gray-700 border border-gray-800 rounded-full px-2 py-0 shadow-lg cursor-default z-10 ${
                        isSecondLastMessage &&
                        nextMessageCharacter?.action === 'speaking' &&
                        !scene.conversation_ended
                          ? 'animate-pulse'
                          : ''
                      }`}
                    >
                      {nextMessage.reaction_on_previous_message}
                    </span>
                  )}
              </div>
            );
          })}
          {Object.values(scene.characters)
            .filter((c) => c.action.startsWith('thinking'))
            .map((c) => (
              <div
                key={c.name}
                className="mx-4 p-1 px-2 sm:px-4 pr-4 sm:pr-6 rounded-lg bg-gray-700 animate-pulse w-fit relative text-sm sm:text-base italic"
              >
                <div className="flex items-baseline gap-1 cursor-default">
                  <span className="font-bold" style={{ color: c.color }}>
                    {c.name}
                  </span>
                  <span className="text-[10px] sm:text-xs text-gray-400">
                    is thinking...
                  </span>
                </div>
              </div>
            ))}
          {scene.conversation_ended && (
            <div className="p-3 rounded-lg bg-red-700/80 animate-pulse font-bold text-center flex flex-col gap-1 relative overflow-hidden">
              <div>Conversation ended</div>
              {countdown > 0 && (
                <>
                  <div className="text-sm font-normal opacity-90">
                    New conversation will begin in {formatCountdown(countdown)}
                  </div>
                  <div
                    className="absolute bottom-0 left-0 h-1 bg-red-500 transition-all duration-1000"
                    style={{
                      width: `${getProgressPercentage(countdown, 300)}%`,
                    }}
                  />
                </>
              )}
              <div className="mt-2">
                <SceneProposalForm
                  trigger={
                    <Button variant="outline" size="sm">
                      Propose Next Scene
                    </Button>
                  }
                  setIsModalOpen={setIsModalOpen}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
