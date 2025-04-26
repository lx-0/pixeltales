import { z } from 'zod';
import { BaseEventSchema } from './EventBase';

// --- Perception Payload Schemas --- //

export const MessageBroadcastPayloadSchema = z.object({
  sourceVisualId: z.string().optional(), // Moved here
  content: z.string().describe('The text content of the message.'),
  metadata: z.record(z.string(), z.any()).optional(),
});
export type MessageBroadcastPayload = z.infer<typeof MessageBroadcastPayloadSchema>;

const AgentEnteredPayloadSchema = z.object({
  sourceVisualId: z.string().optional(), // Moved here (might be the environment source)
  visualId: z.string().describe('The visual identifier of the agent that entered.'),
  visualDescription: z.string().optional().describe("A description of the agent's appearance."),
  metadata: z.record(z.string(), z.any()).optional(),
});
export type AgentEnteredPayload = z.infer<typeof AgentEnteredPayloadSchema>;

const AgentLeftPayloadSchema = z.object({
  sourceVisualId: z.string().optional(), // Moved here (might be the environment source)
  visualId: z.string().describe('The visual identifier of the agent that left.'),
  metadata: z.record(z.string(), z.any()).optional(),
});
export type AgentLeftPayload = z.infer<typeof AgentLeftPayloadSchema>;

const SceneUpdatePayloadSchema = z.object({
  sourceVisualId: z.string().optional(), // Moved here (might be the environment source)
  description: z.string().describe('Description of the change in the scene.'),
  metadata: z.record(z.string(), z.any()).optional(),
});
export type SceneUpdatePayload = z.infer<typeof SceneUpdatePayloadSchema>;

const AgentMovedPayloadSchema = z.object({
  sourceVisualId: z.string().optional(), // Moved here (agent causing the move)
  visualId: z.string().describe('The visual identifier of the agent that moved.'),
  newPosition: z.object({ x: z.number(), y: z.number() }),
  metadata: z.record(z.string(), z.any()).optional(),
});
export type AgentMovedPayload = z.infer<typeof AgentMovedPayloadSchema>;

const AgentVisiblePayloadSchema = z.object({
  sourceVisualId: z.string().optional(), // Moved here (agent causing the visibility event - likely self)
  visualId: z.string().describe('The visual identifier of the agent that is visible.'),
  metadata: z.record(z.string(), z.any()).optional(),
});
export type AgentVisiblePayload = z.infer<typeof AgentVisiblePayloadSchema>;

const ObjectInteractionPayloadSchema = z.object({
  sourceVisualId: z.string().optional(), // Moved here (agent causing the interaction)
  visualId: z.string().describe('The visual identifier of the agent performing the interaction.'),
  objectId: z.string().describe('The ID of the object being interacted with.'),
  interactionType: z.string().describe('Type of interaction (e.g., picked_up, used).'),
  metadata: z.record(z.string(), z.any()).optional(),
});
export type ObjectInteractionPayload = z.infer<typeof ObjectInteractionPayloadSchema>;

// --- Specific Perception Event Schemas (Extend BaseEventSchema directly) --- //

const MessageBroadcastEventSchema = BaseEventSchema.extend({
  // Extends BaseEventSchema directly
  type: z.literal('perception.message'),
  payload: MessageBroadcastPayloadSchema,
});

const AgentEnteredEventSchema = BaseEventSchema.extend({
  // Extends BaseEventSchema directly
  type: z.literal('perception.enter'),
  payload: AgentEnteredPayloadSchema,
});

const AgentLeftEventSchema = BaseEventSchema.extend({
  // Extends BaseEventSchema directly
  type: z.literal('perception.leave'),
  payload: AgentLeftPayloadSchema,
});

const SceneUpdateEventSchema = BaseEventSchema.extend({
  // Extends BaseEventSchema directly
  type: z.literal('perception.scene_update'),
  payload: SceneUpdatePayloadSchema,
});

const AgentMovedEventSchema = BaseEventSchema.extend({
  // Extends BaseEventSchema directly
  type: z.literal('perception.agent_moved'),
  payload: AgentMovedPayloadSchema,
});

const AgentVisibleEventSchema = BaseEventSchema.extend({
  // Extends BaseEventSchema directly
  type: z.literal('perception.agent_visible'),
  payload: AgentVisiblePayloadSchema,
});

const ObjectInteractionEventSchema = BaseEventSchema.extend({
  // Extends BaseEventSchema directly
  type: z.literal('perception.object_interaction'),
  payload: ObjectInteractionPayloadSchema,
});

// --- Union and Type Definition --- //

export const AgentPerceptionEventSchema = z.discriminatedUnion('type', [
  MessageBroadcastEventSchema,
  AgentEnteredEventSchema,
  AgentLeftEventSchema,
  SceneUpdateEventSchema,
  AgentMovedEventSchema,
  ObjectInteractionEventSchema,
  AgentVisibleEventSchema,
]);

export type AgentPerceptionEvent = z.infer<typeof AgentPerceptionEventSchema>;
