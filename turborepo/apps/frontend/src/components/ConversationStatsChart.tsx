import { type SceneState } from '@/types/scene';
import { formatTime } from '@/utils/format';
import { MessageSquare } from 'lucide-react';
import { useMemo } from 'react';
import {
  CartesianGrid,
  Label,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader } from './ui/card';

interface ConversationStatsChartProps {
  scene: SceneState;
}

interface DotProps {
  key: string; // e.g. 'dot-123'
  index: number; // index of the dot in the data array, e.g. 123
  cx: number;
  cy: number | null; // null if no `value`
  r: number; // radius of the dot, e.g. 4
  dataKey: string; // `ratings.${charId}`
  payload: DataPoint;
  name: string; // character name, e.g. 'John'
  value?: number; // rating, e.g. 8
  stroke: string; // character color, e.g. '#000000'
  strokeWidth: number;
  fill: string;
}

interface DataPoint {
  timestamp: number;
  chars: Record<string, DataPointCharProps>;
}

interface DataPointCharProps {
  charId: string;
  name: string;
  color: string;
  rating: number | null;
  mood: string;
  moodEmoji: string;
  hasRequestedEndConversation: boolean;
}

export default function ConversationStatsChart({
  scene,
}: ConversationStatsChartProps) {
  const characterDatasets: DataPoint[] = useMemo(
    () =>
      scene.messages
        .sort((a, b) => a.unix_timestamp - b.unix_timestamp)
        .map((message) => ({
          timestamp: message.unix_timestamp,
          chars: {
            [message.character]: {
              charId: message.character,
              name: message.character,
              color: message.character,
              rating: message.conversation_rating || 0,
              mood: message.mood,
              moodEmoji: message.mood_emoji,
              hasRequestedEndConversation: message.end_conversation,
            },
          },
        })),
    [scene.messages],
  );

  return (
    <Card className="p-2 sm:p-4 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
      <CardHeader className="p-0">
        <div className="flex justify-between items-center mb-2 sm:mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-gray-400" />
            <h2 className="text-lg sm:text-xl font-bold text-gray-100">
              Conversation Ratings
            </h2>
          </div>
          <div className="flex gap-2">
            {/* <Button
              variant="outline"
              size="sm"
              onClick={resetZoom}
              className="text-gray-400 hover:text-gray-100"
              disabled={!zoomState.data.length && zoomState.zoomLevel === 1}
            >
              <ZoomOut className="w-4 h-4" />
            </Button> */}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[300px] w-full select-none">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              margin={{ top: 0, right: 30, bottom: 30, left: 0 }}
              data={Object.values(characterDatasets)}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                // type="number" // disable to normalize x-axis
                // domain={['dataMin', 'dataMax']} // disable to normalize x-axis
                dataKey="timestamp"
                interval="preserveStartEnd"
                minTickGap={50}
                tickFormatter={(unix) =>
                  formatTime(unix, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                }
                angle={-45}
                textAnchor="end"
                tickMargin={6}
                stroke="#9CA3AF"
                fontSize={12}
              />
              <YAxis
                domain={[0, 10]}
                tickCount={6}
                stroke="#9CA3AF"
                fontSize={12}
              >
                <Label
                  value="Rating"
                  position="insideLeft"
                  offset={24}
                  angle={-90}
                  style={{ fill: '#9CA3AF', fontSize: 12 }}
                />
              </YAxis>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '0.375rem',
                  fontSize: '12px',
                  maxWidth: '160px',
                }}
                // itemStyle={{ color: '#D1D5DB' }}
                labelStyle={{ color: '#D1D5DB' }}
                labelFormatter={(value) =>
                  formatTime(value, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                }
                formatter={(value, name, props) => {
                  const charProps = Object.values(
                    props.payload.chars,
                  ).pop() as DataPointCharProps;
                  if (value === null) return null;
                  return [
                    <span className="text-pretty">
                      {value}/10
                      <div>
                        {charProps.mood} {charProps.moodEmoji}
                      </div>
                      {charProps.hasRequestedEndConversation && (
                        <div className="text-gray-400 italic text-center mt-2">
                          requested to end the conversation
                        </div>
                      )}
                    </span>,
                    name,
                  ];
                }}
              />
              <Legend verticalAlign="top" height={36} />

              {/* Render lines for each character */}
              {Object.entries(scene.characters).map(([charId, character]) => (
                <Line
                  key={`line-${charId}`}
                  type="monotone"
                  dataKey={`chars.${charId}.rating`}
                  name={character.name}
                  connectNulls
                  stroke={character.color}
                  strokeWidth={2}
                  // isAnimationActive={false}
                  dot={(props: DotProps) => {
                    if (!props || props.value === undefined) {
                      // Return hidden dot if no value
                      return (
                        <g key={`${props.key}-${charId}`}>
                          <circle cx={0} cy={0} r={0} fill="none" />
                        </g>
                      );
                    }

                    const cy = props.cy ?? 0;
                    const charProps = props.payload.chars[charId];

                    return (
                      <g key={`${props.key}-${charId}`}>
                        <circle
                          cx={props.cx}
                          cy={cy}
                          r={props.r}
                          stroke={props.stroke}
                          strokeWidth={props.strokeWidth}
                          fill={character.color}
                        />
                        {charProps.moodEmoji && (
                          <text
                            key={`mood-${props.key}`}
                            x={props.cx}
                            y={cy - 10}
                            textAnchor="middle"
                            fontSize="12"
                            fill={character.color}
                            style={{ pointerEvents: 'none' }}
                          >
                            {charProps.moodEmoji}
                          </text>
                        )}
                        {charProps.hasRequestedEndConversation && (
                          <text
                            key={`end-conversation-${props.key}`}
                            x={props.cx}
                            y={cy + 18}
                            textAnchor="middle"
                            fontSize="12"
                            fill={character.color}
                            style={{ pointerEvents: 'none' }}
                          >
                            ❌
                          </text>
                        )}
                      </g>
                    );
                  }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
