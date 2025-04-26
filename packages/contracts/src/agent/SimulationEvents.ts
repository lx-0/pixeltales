import { z } from 'zod';
import { BaseEventSchema } from './EventBase'; // Import Base
// Import base schemas if needed (e.g., for target types in move)

// --- Payload Schemas --- //

export const AgentSpeakEventPayloadSchema = z.object({
  agentId: z.string(),
  content: z.string(),
  tone: z.string().optional(),
  targetAudience: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});
export type AgentSpeakEventPayload = z.infer<typeof AgentSpeakEventPayloadSchema>;

export const AgentMoveEventPayloadSchema = z.object({
  agentId: z.string(),
  target: z
    .union([
      z.object({ x: z.number(), y: z.number() }).describe('Target coordinates'),
      z.string().describe('Target object ID or location name'),
    ])
    .describe('The target destination for the move action.'),
  pathfinding: z.string().optional(),
});
export type AgentMoveEventPayload = z.infer<typeof AgentMoveEventPayloadSchema>;

// --- Simulation Agent Action Payloads --- //
// (Keep existing speak/move payloads)
export const AgentSpeakSimulationPayloadSchema = z.object({
  agentId: z.string().uuid(),
  content: z.string(),
  tone: z.string().optional(),
  targetAudience: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});
export const AgentMoveSimulationPayloadSchema = z.object({
  agentId: z.string().uuid(),
  target: z.union([z.object({ x: z.number(), y: z.number() }), z.string()]),
  pathfinding: z.string().optional(),
});

// --- Raw Simulation Event/State Payloads --- //

// Payload for when speech occurs in the simulation
export const SpeechOccurredSimulationEventPayloadSchema = z.object({
  agentId: z.string().uuid().describe('ID of the agent who spoke'),
  content: z.string(),
  tone: z.string().optional(),
  position: z
    .object({ x: z.number(), y: z.number() })
    .optional()
    .describe('Position where speech occurred'),
  // Potentially add sceneId if needed for context
});
export type SpeechOccurredSimulationEventPayload = z.infer<
  typeof SpeechOccurredSimulationEventPayloadSchema
>;

// Payload for when an agent's position changes in the simulation state
export const AgentMovedSimulationStatePayloadSchema = z.object({
  agentId: z.string().uuid(),
  newPosition: z.object({ x: z.number(), y: z.number() }),
  previousPosition: z.object({ x: z.number(), y: z.number() }).optional(),
  metadata: z.record(z.string(), z.any()).optional().describe('Optional metadata like move target'),
});
export type AgentMovedSimulationStatePayload = z.infer<
  typeof AgentMovedSimulationStatePayloadSchema
>;

// --- Simulation Action Event Schemas (Agent -> Sim) --- //

const AgentSpeakSimulationEventSchema = BaseEventSchema.extend({
  type: z.literal('simulation.agent.speak'),
  payload: AgentSpeakSimulationPayloadSchema,
});
const AgentMoveSimulationEventSchema = BaseEventSchema.extend({
  type: z.literal('simulation.agent.move'),
  payload: AgentMoveSimulationPayloadSchema,
});

// --- Raw Simulation Event/State Schemas (Sim -> Extensions/World) --- //

export const SpeechOccurredSimulationEventSchema = BaseEventSchema.extend({
  type: z.literal('simulation.event.speech_occurred'),
  payload: SpeechOccurredSimulationEventPayloadSchema,
});
export type SpeechOccurredSimulationEvent = z.infer<typeof SpeechOccurredSimulationEventSchema>;

export const AgentMovedSimulationStateSchema = BaseEventSchema.extend({
  type: z.literal('simulation.state.agent_moved'),
  payload: AgentMovedSimulationStatePayloadSchema,
});
export type AgentMovedSimulationState = z.infer<typeof AgentMovedSimulationStateSchema>;

// --- Union for Simulation Agent Actions --- //
export const SimulationAgentActionEventSchema = z.discriminatedUnion('type', [
  AgentSpeakSimulationEventSchema,
  AgentMoveSimulationEventSchema,
  // Add other simulation actions triggered BY agents here
]);
export type SimulationAgentActionEvent = z.infer<typeof SimulationAgentActionEventSchema>;

// --- Union for Raw Simulation Events/State Changes --- //
// Used for publishing simulation changes for perception systems etc.
export const RawSimulationEventSchema = z.discriminatedUnion('type', [
  SpeechOccurredSimulationEventSchema,
  AgentMovedSimulationStateSchema,
  // Add other raw simulation state changes/events here (e.g., object state change, time tick)
]);
export type RawSimulationEvent = z.infer<typeof RawSimulationEventSchema>;
