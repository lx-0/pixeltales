import { Brain, Clock, MessageSquare, Users2 } from 'lucide-react';
import type { SceneState } from '../types/scene';
import { formatDuration, formatTime } from '../utils/format';
import ConversationStatsChart from './ConversationStatsChart';
import { SceneProposalForm } from './SceneProposalForm';
import { SceneProposalList } from './SceneProposalList';
import { Button } from './ui/button';

interface SceneInfoProps {
  scene: SceneState;
  setIsModalOpen: (isOpen: boolean) => void;
}

export default function SceneInfo({ scene, setIsModalOpen }: SceneInfoProps) {
  // Calculate active characters (those who have spoken)
  const activeCharacters = Object.values(scene.characters).filter((char) =>
    scene.messages.some((msg) => msg.character === char.id),
  );

  // Calculate average response time
  const averageResponseTime =
    scene.messages.length > 1
      ? scene.messages.reduce((acc, msg, idx) => {
          if (idx === 0) return 0;
          return (
            acc + (msg.unix_timestamp - scene.messages[idx - 1].unix_timestamp)
          );
        }, 0) /
        (scene.messages.length - 1)
      : 0;

  // Calculate conversation metrics
  const totalResponseTime = scene.messages.reduce(
    (acc, msg) => acc + (msg.calculated_speaking_time || 0),
    0,
  );

  // Find characters who want to end the conversation
  const endRequesters = Object.values(scene.characters).filter(
    (char) => char.end_conversation_requested,
  );

  // Calculate average conversation rating
  const ratingsCount = scene.messages.filter(
    (m) => m.conversation_rating !== null,
  ).length;
  const averageRating =
    ratingsCount > 0
      ? scene.messages.reduce(
          (acc, msg) => acc + (msg.conversation_rating || 0),
          0,
        ) / ratingsCount
      : null;

  // Calculate total tokens used per model
  const modelUsage = scene.messages.reduce((acc, msg) => {
    const char = scene.characters[msg.character];
    const modelKey = `${char.llm_config.provider}:${char.llm_config.model_name}`;
    acc[modelKey] = (acc[modelKey] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate elapsed time
  const elapsedSeconds = Math.floor(Date.now() / 1000 - scene.started_at);

  return (
    <div className="space-y-4">
      {/* Scene Info Card */}
      <div className="p-2 sm:p-4 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-2 sm:mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-gray-100">
              Scene Information
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                #{scene.scene_id}
              </span>
              <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                Config #{scene.scene_config_id}
              </span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <SceneProposalList
              trigger={
                <Button
                  className="text-gray-300 bg-gray-900 hover:bg-gray-600 w-full sm:w-auto"
                  variant="secondary"
                  size="sm"
                >
                  View Proposals
                </Button>
              }
              setIsModalOpen={setIsModalOpen}
            />
            <SceneProposalForm
              trigger={
                <Button
                  className="text-gray-300 bg-gray-900 hover:bg-gray-600 w-full sm:w-auto"
                  variant="secondary"
                  size="sm"
                >
                  Propose Next Scene
                </Button>
              }
              setIsModalOpen={setIsModalOpen}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {/* Time Information */}
          <div className="bg-gray-700 p-2 sm:p-4 rounded-lg">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Clock className="w-4 h-4" />
                <span>Time Stats</span>
              </div>
              <div className="grid gap-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Started:</span>
                  <span className="text-gray-100">
                    {formatTime(scene.started_at)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Duration:</span>
                  <span className="text-gray-100">
                    {formatDuration(elapsedSeconds)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Speaking:</span>
                  <span className="text-gray-100">
                    {formatDuration(totalResponseTime)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Idle:</span>
                  <span className="text-gray-100">
                    {formatDuration(elapsedSeconds - totalResponseTime)}
                  </span>
                </div>
                {scene.conversation_ended && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className="text-red-400">Conversation ended</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Interaction Stats */}
          <div className="bg-gray-700 p-2 sm:p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="w-4 h-4 text-gray-400" />
              <p className="text-gray-400 text-xs sm:text-sm">
                Interaction Stats
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <span className="text-gray-100 text-sm sm:text-base">
                  {scene.messages.length}
                </span>
                <span className="text-gray-400 text-xs">messages</span>
              </div>
              {averageResponseTime > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-gray-100 text-sm sm:text-base">
                    {formatDuration(Math.round(averageResponseTime))}
                  </span>
                  <span className="text-gray-400 text-xs">avg. response</span>
                </div>
              )}
              {averageRating !== null && (
                <div className="flex items-center gap-1">
                  <span className="text-gray-100 text-sm sm:text-base">
                    {averageRating.toFixed(1)}
                  </span>
                  <span className="text-gray-400 text-xs">avg. rating</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <span className="text-gray-100 text-sm sm:text-base">
                  {(scene.messages.length / (elapsedSeconds / 60)).toFixed(1)}
                </span>
                <span className="text-gray-400 text-xs">msg/min</span>
              </div>
            </div>
          </div>

          {/* Participant Stats */}
          <div className="bg-gray-700 p-2 sm:p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Users2 className="w-4 h-4 text-gray-400" />
              <p className="text-gray-400 text-xs sm:text-sm">Participants</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <span className="text-gray-100 text-sm sm:text-base">
                  {activeCharacters.length}/
                  {Object.keys(scene.characters).length}
                </span>
                <span className="text-gray-400 text-xs">characters active</span>
              </div>
              {scene.visitor_count > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-gray-100 text-sm sm:text-base">
                    {scene.visitor_count}
                  </span>
                  <span className="text-gray-400 text-xs">
                    viewer{scene.visitor_count !== 1 ? 's' : ''} online
                  </span>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                </div>
              )}
              {endRequesters.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-red-400 text-sm sm:text-base">
                    {endRequesters.length}
                  </span>
                  <span className="text-gray-400 text-xs">
                    want{endRequesters.length === 1 ? 's' : ''} to end
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Model Usage */}
          <div className="bg-gray-700 p-2 sm:p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Brain className="w-4 h-4 text-gray-400" />
              <p className="text-gray-400 text-xs sm:text-sm">Model Usage</p>
            </div>
            <div className="space-y-1">
              {Object.entries(modelUsage).map(([model, count]) => (
                <div key={model} className="flex items-center gap-1">
                  <span className="text-gray-100 text-sm sm:text-base">
                    {count}
                  </span>
                  <span className="text-gray-400 text-xs">
                    {model.split(':')[1]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Characters Card */}
      <div className="p-2 sm:p-4 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
        <div className="flex justify-between items-center mb-2 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-100">
            Characters
          </h2>
          <div className="text-xs text-gray-400">
            {activeCharacters.length}/{Object.keys(scene.characters).length}{' '}
            active
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
          {Object.entries(scene.characters).map(([id, char]) => {
            const messageCount = scene.messages.filter(
              (msg) => msg.character === id,
            ).length;
            const lastMessage = [...scene.messages]
              .reverse()
              .find((msg) => msg.character === id);

            // Calculate character-specific metrics
            const characterMessages = scene.messages.filter(
              (msg) => msg.character === id,
            );
            const avgResponseTime =
              characterMessages.length > 1
                ? characterMessages.reduce((acc, msg, idx) => {
                    if (idx === 0) return 0;
                    return acc + (msg.calculated_speaking_time || 0);
                  }, 0) /
                  (characterMessages.length - 1)
                : 0;

            // Calculate message frequency
            const messageFrequency = messageCount / (elapsedSeconds / 60);

            // Calculate character average rating
            const characterRatings = characterMessages.filter(
              (msg) => msg.conversation_rating !== null,
            );
            const avgRating =
              characterRatings.length > 0
                ? characterRatings.reduce(
                    (acc, msg) => acc + (msg.conversation_rating || 0),
                    0,
                  ) / characterRatings.length
                : null;

            return (
              <div
                key={id}
                className="p-2 sm:p-4 bg-gray-700 rounded-lg border-2 shadow-md transition-all duration-200 hover:shadow-lg"
                style={{ borderColor: char.color }}
              >
                {/* Header with name and model */}
                <div className="flex justify-between items-start mb-3">
                  <h3
                    className="text-lg sm:text-xl font-bold"
                    style={{ color: char.color }}
                  >
                    {char.name}
                  </h3>
                  <div className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                    {char.llm_config.model_name}
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-300 text-xs sm:text-sm mb-3">
                  {char.visual}
                </p>
                <p className="text-gray-400 text-xs sm:text-sm italic mb-3">
                  {char.role.split('\n')[0]}
                </p>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                  <div className="bg-gray-800 p-2 rounded">
                    <div className="text-gray-400 mb-1">Messages</div>
                    <div className="text-gray-200">
                      {messageCount} ({messageFrequency.toFixed(1)}/min)
                    </div>
                  </div>
                  <div className="bg-gray-800 p-2 rounded">
                    <div className="text-gray-400 mb-1">Response Time</div>
                    <div className="text-gray-200">
                      {formatDuration(Math.round(avgResponseTime))} avg
                    </div>
                  </div>
                  {avgRating !== null && (
                    <div
                      className={`bg-gray-800 p-2 rounded ${
                        !lastMessage?.conversation_rating ? 'col-span-2' : ''
                      }`}
                    >
                      <div className="text-gray-400 mb-1">Average Rating</div>
                      <div className="text-gray-200">
                        {avgRating.toFixed(1)}/10
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-2 text-xs">
                  <div className="bg-gray-800 px-2 py-1 rounded text-gray-300">
                    {char.current_mood || 'Neutral'}
                  </div>
                  <div className="bg-gray-800 px-2 py-1 rounded text-gray-300">
                    {char.action.replace(':', ' - ')}
                  </div>
                  {lastMessage?.conversation_rating && (
                    <div className="bg-gray-800 px-2 py-1 rounded text-gray-300">
                      Last Rating: {lastMessage.conversation_rating}/10
                    </div>
                  )}
                  {char.end_conversation_requested && (
                    <div className="bg-red-900/50 px-2 py-1 rounded text-red-300 flex items-center gap-1">
                      Wants to end
                      {char.end_conversation_requested_validity_duration && (
                        <span className="text-gray-400">
                          (
                          {formatDuration(
                            Math.round(
                              char.end_conversation_requested_validity_duration -
                                (Date.now() / 1000 -
                                  (char.end_conversation_requested_at || 0)),
                            ),
                          )}
                          )
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Conversation Stats Chart */}
      <ConversationStatsChart scene={scene} />
    </div>
  );
}
