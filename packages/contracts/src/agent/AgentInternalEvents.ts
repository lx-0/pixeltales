import { z } from 'zod';
import { AgentDynamicStateSchema } from './AgentState'; // Import dependent state schema
import { BaseEventSchema } from './EventBase'; // Import Base

// --- Payload Schemas ---

export const CognitiveCyclePhaseCompletedPayloadSchema = z.object({
  agentId: z.string().uuid(),
  phase: z.enum(['observe', 'orient', 'decide', 'act', 'cycle']),
  durationMs: z.number(),
  actionType: z.string().optional().describe('Type of action decided in decide phase'), // Optional, relevant for decide phase
});
export type CognitiveCyclePhaseCompletedPayload = z.infer<
  typeof CognitiveCyclePhaseCompletedPayloadSchema
>;

export const CognitiveCycleErrorPayloadSchema = z.object({
  agentId: z.string().uuid(),
  error: z.string(),
  perceptionType: z.string().optional(),
});
export type CognitiveCycleErrorPayload = z.infer<typeof CognitiveCycleErrorPayloadSchema>;

export const LearningRewardRecordedPayloadSchema = z.object({
  agentId: z.string().uuid(),
  rewardScore: z.number(),
  // TODO: Consider adding state/action identifiers if needed for debugging/tracing
});
export type LearningRewardRecordedPayload = z.infer<typeof LearningRewardRecordedPayloadSchema>;

export const LearningPolicyUpdatedPayloadSchema = z.object({
  agentId: z.string().uuid(),
});
export type LearningPolicyUpdatedPayload = z.infer<typeof LearningPolicyUpdatedPayloadSchema>;

export const SelfModelUpdatedPayloadSchema = z.object({
  agentId: z.string().uuid(),
  updatedFields: z.array(z.string()),
});
export type SelfModelUpdatedPayload = z.infer<typeof SelfModelUpdatedPayloadSchema>;

export const ExperimentResultRecordedPayloadSchema = z.object({
  agentId: z.string().uuid(),
  // Assuming 'result' has a defined structure, adjust as needed
  result: z.record(z.string(), z.any()), // Placeholder, use specific ExperimentResult schema if available
});
export type ExperimentResultRecordedPayload = z.infer<typeof ExperimentResultRecordedPayloadSchema>;

export const SystemNotificationDispatchedPayloadSchema = z.object({
  notificationType: z.string().describe('e.g., learning, alert, system_message'),
  recipientAgentId: z.string().uuid().optional(), // Optional if it's a system-wide notification
  title: z.string().optional(),
  message: z.string(),
  data: z.record(z.string(), z.any()).optional(), // To carry original notification data if needed
});
export type SystemNotificationDispatchedPayload = z.infer<
  typeof SystemNotificationDispatchedPayloadSchema
>;

// NEW: Payload for Dynamic State Updates
export const AgentDynamicStateUpdatedPayloadSchema = z.object({
  agentId: z.string().uuid(),
  updates: z.record(z.any()).describe('The partial dynamic state updates applied'),
  newState: AgentDynamicStateSchema.describe('The complete dynamic state after updates'),
  // previousStateSample: z.record(z.any()).optional().describe('Optional: Snapshot of key previous state fields'),
});
export type AgentDynamicStateUpdatedPayload = z.infer<typeof AgentDynamicStateUpdatedPayloadSchema>;

// --- Specific Event Schemas (Extending Base) ---

export const CognitiveCyclePhaseCompletedEventSchema = BaseEventSchema.extend({
  type: z.literal('agent.cognitive.cycle.phase_completed'),
  payload: CognitiveCyclePhaseCompletedPayloadSchema,
});
export type CognitiveCyclePhaseCompletedEvent = z.infer<
  typeof CognitiveCyclePhaseCompletedEventSchema
>;

export const CognitiveCycleErrorEventSchema = BaseEventSchema.extend({
  type: z.literal('agent.cognitive.cycle.error'),
  payload: CognitiveCycleErrorPayloadSchema,
});
export type CognitiveCycleErrorEvent = z.infer<typeof CognitiveCycleErrorEventSchema>;

export const LearningRewardRecordedEventSchema = BaseEventSchema.extend({
  type: z.literal('learning.reward.recorded'),
  payload: LearningRewardRecordedPayloadSchema,
});
export type LearningRewardRecordedEvent = z.infer<typeof LearningRewardRecordedEventSchema>;

export const LearningPolicyUpdatedEventSchema = BaseEventSchema.extend({
  type: z.literal('learning.policy.updated'),
  payload: LearningPolicyUpdatedPayloadSchema,
});
export type LearningPolicyUpdatedEvent = z.infer<typeof LearningPolicyUpdatedEventSchema>;

export const SelfModelUpdatedEventSchema = BaseEventSchema.extend({
  type: z.literal('agent.state.self_model_updated'),
  payload: SelfModelUpdatedPayloadSchema,
});
export type SelfModelUpdatedEvent = z.infer<typeof SelfModelUpdatedEventSchema>;

export const ExperimentResultRecordedEventSchema = BaseEventSchema.extend({
  type: z.literal('learning.discovery.experiment_result'),
  payload: ExperimentResultRecordedPayloadSchema,
});
export type ExperimentResultRecordedEvent = z.infer<typeof ExperimentResultRecordedEventSchema>;

export const SystemNotificationDispatchedEventSchema = BaseEventSchema.extend({
  type: z.literal('system.notification.dispatched'),
  payload: SystemNotificationDispatchedPayloadSchema,
});
export type SystemNotificationDispatchedEvent = z.infer<
  typeof SystemNotificationDispatchedEventSchema
>;

// NEW: Specific event type for dynamic state updates
export const AgentDynamicStateUpdatedEventSchema = BaseEventSchema.extend({
  type: z.literal('agent.state.dynamic.updated'),
  payload: AgentDynamicStateUpdatedPayloadSchema,
});
export type AgentDynamicStateUpdatedEvent = z.infer<typeof AgentDynamicStateUpdatedEventSchema>;

// --- Discriminated Union Schema for Agent Internal Events ---

export const AgentInternalEventSchema = z.discriminatedUnion('type', [
  CognitiveCyclePhaseCompletedEventSchema,
  CognitiveCycleErrorEventSchema,
  LearningRewardRecordedEventSchema,
  LearningPolicyUpdatedEventSchema,
  SelfModelUpdatedEventSchema,
  ExperimentResultRecordedEventSchema,
  SystemNotificationDispatchedEventSchema,
  AgentDynamicStateUpdatedEventSchema, // Added the new event schema here
  // Add other internal schemas here
]);

// Final Union Type for Agent Internal Events
export type AgentInternalEvent = z.infer<typeof AgentInternalEventSchema>;
