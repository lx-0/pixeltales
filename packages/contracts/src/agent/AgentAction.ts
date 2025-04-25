import { z } from 'zod';

// Define the plan context schema once
const PlanContextSchema = z
  .object({
    planId: z.string().uuid(),
    nodeId: z.string().uuid(), // Using nodeId as discussed
  })
  .describe('Context linking action to the HTN plan node it executes.');

/**
 * Schema for spoken output from an agent, including content and metadata.
 */
export const CharacterResponseSchema = z
  .object({
    content: z.string().describe('The spoken text content.'),
    tone: z
      .string()
      .optional()
      .describe('The emotional tone or style of the speech (e.g., happy, sarcastic, formal).'),
    targetAudience: z
      .array(z.string())
      .optional()
      .describe('Specific visualIds of agents the speech is directed towards, if any.'),
  })
  .describe("Detailed structure for an agent's spoken output.");

export type CharacterResponse = z.infer<typeof CharacterResponseSchema>;

/**
 * Base schema for internal tool calls.
 */
const BaseToolCallSchema = z.object({
  toolName: z
    .string()
    .describe('The name of the internal tool being called (e.g., memory.addObservation).'),
  arguments: z.record(z.string(), z.any()).describe('Arguments passed to the tool.'),
});

/**
 * Schema for the 'speak' action.
 */
const SpeakActionSchema = z.object({
  type: z.literal('speak'),
  payload: CharacterResponseSchema.extend({
    // Extend the base response
    planContext: PlanContextSchema.optional(), // Add optional plan context
  }).describe('The detailed content and style of the speech, optionally linked to a plan.'),
});

/**
 * Schema for the 'move' action.
 */
const MoveActionSchema = z.object({
  type: z.literal('move'),
  payload: z
    .object({
      target: z
        .union([z.object({ x: z.number(), y: z.number() }), z.string()])
        .describe('Target coordinates (x, y) or target object ID.'),
      pathfinding: z
        .enum(['direct', 'shortest', 'avoid_obstacles'])
        .optional()
        .default('shortest')
        .describe('Pathfinding strategy.'),
      planContext: PlanContextSchema.optional(), // Add optional plan context
    })
    .describe('Details of the movement action, optionally linked to a plan.'),
});

/**
 * Schema for the 'interact' action.
 */
const InteractActionSchema = z.object({
  type: z.literal('interact'),
  payload: z
    .object({
      objectId: z.string().describe('ID of the object to interact with.'),
      interactionType: z.string().describe('Type of interaction (e.g., pickup, use, open).'),
      planContext: PlanContextSchema.optional(), // Add optional plan context
    })
    .describe('Details of the interaction action, optionally linked to a plan.'),
});

/**
 * Schema for the 'use_internal_tool' action.
 */
const UseInternalToolActionSchema = z.object({
  type: z.literal('use_internal_tool'),
  payload: BaseToolCallSchema.extend({
    // Extend the base tool call
    planContext: PlanContextSchema.optional(), // Add optional plan context
  }).describe('The specific internal tool call details, optionally linked to a plan.'),
});

/**
 * Schema for the 'update_state' action.
 * Note: This action type might not typically originate from a plan,
 * so planContext is omitted here, but could be added if needed.
 */
const UpdateStateActionSchema = z.object({
  type: z.literal('update_state'),
  payload: z
    .record(z.string(), z.any())
    .describe('Partial dynamic state updates (e.g., { mood: "happy", currentFocus: "topic_A" }).'),
});

/**
 * Schema for the 'experiment' action.
 */
const ExperimentActionSchema = z.object({
  type: z.literal('experiment'),
  payload: z
    .object({
      experimentId: z.string().describe('Identifier for the experiment being conducted.'),
      actionDescription: z
        .string()
        .describe('Description of the specific action taken as part of the experiment.'),
      planContext: PlanContextSchema.optional(), // Add optional plan context
    })
    .describe('Details about the experimental action being taken, optionally linked to a plan.'),
});

/**
 * Schema for the 'no_action' action.
 */
const NoActionSchema = z.object({
  type: z.literal('no_action'),
  payload: z
    .object({
      reason: z.string().optional().describe('Optional reason for taking no action.'),
    })
    .optional(),
});

/**
 * Represents the possible actions an agent can decide to take after a cognitive cycle.
 * This is the primary output of the Cognitive Cycle / Action System.
 */
export const AgentActionSchema = z
  .discriminatedUnion('type', [
    SpeakActionSchema,
    MoveActionSchema,
    InteractActionSchema,
    UseInternalToolActionSchema,
    UpdateStateActionSchema,
    ExperimentActionSchema,
    NoActionSchema,
  ])
  .describe('Union of all possible actions an agent can perform.');

export type AgentAction = z.infer<typeof AgentActionSchema>;
