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

// --- Specific Event Schemas (Extending Base) --- //

// Define the full event schema including base fields and literal type
export const AgentSpeakSimulationEventSchema = BaseEventSchema.extend({
  type: z.literal('simulation.agent.speak'),
  payload: AgentSpeakEventPayloadSchema,
});
// Define the corresponding TypeScript type
export type AgentSpeakSimulationEvent = z.infer<typeof AgentSpeakSimulationEventSchema>;

export const AgentMoveSimulationEventSchema = BaseEventSchema.extend({
  type: z.literal('simulation.agent.move'),
  payload: AgentMoveEventPayloadSchema,
});
export type AgentMoveSimulationEvent = z.infer<typeof AgentMoveSimulationEventSchema>;

// Add other specific simulation event schemas here, extending BaseEventSchema...

// --- Discriminated Union Schema for Simulation Events --- //

// Union based on the FULL event schemas
export const SimulationAgentActionEventSchema = z.discriminatedUnion('type', [
  AgentSpeakSimulationEventSchema,
  AgentMoveSimulationEventSchema,
  // Add other schemas here
]);

// Final Union Type for Simulation Events
export type SimulationAgentActionEvent = z.infer<typeof SimulationAgentActionEventSchema>;
