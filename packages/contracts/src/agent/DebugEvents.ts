import { z } from 'zod';
import { BaseEventSchema } from './EventBase';
// Import specific payload schemas that DebugGateway forwards
import {
  AgentDynamicStateUpdatedPayloadSchema,
  AgentReflectionCompletedPayloadSchema,
  CognitiveCycleErrorPayloadSchema,
  CognitiveCyclePhaseCompletedPayloadSchema,
  LearningPolicyUpdatedPayloadSchema,
  LearningRewardRecordedPayloadSchema,
  SelfModelUpdatedPayloadSchema,
} from './AgentInternalEvents';
import {
  AgentMovedPerceptionPayloadSchema,
  MessageBroadcastPayloadSchema,
} from './AgentPerceptionEvent';
import {
  AgentMovedSimulationStatePayloadSchema,
  SpeechOccurredSimulationEventPayloadSchema,
} from './SimulationEvents';

// Define Schemas for specific events being forwarded by DebugGateway
// We reuse the original payload schemas where possible

const DebugCognitivePhaseEventSchema = BaseEventSchema.extend({
  type: z.literal('agent.cognitive.cycle.phase_completed'),
  payload: CognitiveCyclePhaseCompletedPayloadSchema,
});

const DebugCognitiveErrorEventSchema = BaseEventSchema.extend({
  type: z.literal('agent.cognitive.cycle.error'),
  payload: CognitiveCycleErrorPayloadSchema,
});

const DebugStateUpdateEventSchema = BaseEventSchema.extend({
  type: z.literal('agent.state.dynamic.updated'),
  payload: AgentDynamicStateUpdatedPayloadSchema,
});

const DebugSelfModelUpdateEventSchema = BaseEventSchema.extend({
  type: z.literal('agent.state.self_model_updated'),
  payload: SelfModelUpdatedPayloadSchema,
});

// --- Action Speak (Example - Assuming we want to forward this) ---
// Need the CharacterResponseSchema if we forward agent.action.speak
// import { CharacterResponseSchema } from './CharacterResponse';
// const DebugActionSpeakEventSchema = BaseEventSchema.extend({
//     type: z.literal('agent.action.speak'),
//     payload: CharacterResponseSchema.extend({ /* Add agentId if not present */ }),
// });

const DebugPerceptionMessageEventSchema = BaseEventSchema.extend({
  type: z.literal('perception.message'),
  payload: MessageBroadcastPayloadSchema,
});

const DebugPerceptionAgentMovedEventSchema = BaseEventSchema.extend({
  type: z.literal('perception.agent_moved'),
  payload: AgentMovedPerceptionPayloadSchema,
});

const DebugReflectionCompletedEventSchema = BaseEventSchema.extend({
  type: z.literal('agent.reflection.completed'),
  payload: AgentReflectionCompletedPayloadSchema,
});

const DebugLearningRewardEventSchema = BaseEventSchema.extend({
  type: z.literal('learning.reward.recorded'),
  payload: LearningRewardRecordedPayloadSchema,
});

const DebugLearningPolicyEventSchema = BaseEventSchema.extend({
  type: z.literal('learning.policy.updated'),
  payload: LearningPolicyUpdatedPayloadSchema,
});

const DebugRawSpeechEventSchema = BaseEventSchema.extend({
  type: z.literal('simulation.event.speech_occurred'),
  payload: SpeechOccurredSimulationEventPayloadSchema,
});

const DebugRawMoveEventSchema = BaseEventSchema.extend({
  type: z.literal('simulation.state.agent_moved'),
  payload: AgentMovedSimulationStatePayloadSchema,
});

// Create a discriminated union of ONLY the event types the DebugGateway forwards
export const AgentDebugEventBroadcastSchema = z.discriminatedUnion('type', [
  DebugCognitivePhaseEventSchema,
  DebugCognitiveErrorEventSchema,
  DebugStateUpdateEventSchema,
  DebugSelfModelUpdateEventSchema,
  // DebugActionSpeakEventSchema, // Add if forwarding
  DebugPerceptionMessageEventSchema,
  DebugPerceptionAgentMovedEventSchema,
  DebugReflectionCompletedEventSchema,
  DebugLearningRewardEventSchema,
  DebugLearningPolicyEventSchema,
  DebugRawSpeechEventSchema,
  DebugRawMoveEventSchema,
]);

export type AgentDebugEventBroadcast = z.infer<typeof AgentDebugEventBroadcastSchema>;
