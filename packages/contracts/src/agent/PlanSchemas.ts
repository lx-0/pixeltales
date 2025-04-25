import { z } from 'zod';
// Import base schemas directly
import { AgentDynamicStateSchema } from './AgentState';
import { SelfModelSchema } from './DiscoverySchemas';
import { FactSchema, ObservationSchema } from './MemorySchemas';
import { PlanNodeSchema } from './PlanNode'; // Import from new file

/**
 * Schema to represent the current perception state of an agent.
 * This is distinct from perception events which are transient occurrences.
 * When an event occurs in the environment, it's converted to this state representation
 * for cognitive processing.
 */
export const PerceptionStateSchema = z
  .object({
    type: z.string().describe('The type of perception currently being processed'),
    content: z
      .union([z.string(), z.record(z.string(), z.any())])
      .describe('The content of the current perception'),
    sourceVisualId: z
      .string()
      .optional()
      .describe('Visual identifier of the perception source, if applicable'),
    visualIds: z
      .array(z.string())
      .optional()
      .describe('Visual identifiers relevant to this perception'),
    timestamp: z.number().describe('When this perception was received'),
  })
  .describe('Current perception state for the agent');

export type PerceptionState = z.infer<typeof PerceptionStateSchema>;

/**
 * Represents the entire plan for a high-level goal.
 */
export const AgentPlanSchema = z
  .object({
    planId: z.string().uuid().describe('Unique identifier for the entire plan.'),
    goal: z.string().describe('The high-level goal this plan aims to achieve.'),
    rootNodeId: z.string().uuid().describe('The ID of the root node in the plan tree.'),
    nodes: z
      .record(z.string().uuid(), PlanNodeSchema)
      .describe('Map of all nodes in the plan, keyed by their ID.'),
    creationTimestamp: z.number().int().positive().describe('Timestamp when the plan was created.'),
    status: z
      .enum(['active', 'completed', 'failed', 'cancelled'])
      .default('active')
      .describe('Overall status of the plan.'),
  })
  .describe('Represents a complete Hierarchical Task Network (HTN) plan for an agent.');

export type AgentPlan = z.infer<typeof AgentPlanSchema>;

// TODO: Define WorldModelContextSchema when ready
const WorldModelContextSchemaPlaceholder = z.any();

/**
 * Defines the comprehensive context provided to the agent during the Orient phase,
 * used for decision-making and planning.
 *
 * Implementation note: The agent maintains a buffer of unprocessed perceptions.
 * When the cognitive cycle processes a perception, it includes both:
 * 1. The current perception being processed
 * 2. Any other pending perceptions in the buffer
 *
 * This gives the agent awareness of all pending sensory inputs, allowing prioritization
 * and multi-event reasoning, while still maintaining a per-event processing model.
 */
export const OrientationContextSchema = z
  .object({
    // Core inputs
    currentPerception: z
      .array(PerceptionStateSchema)
      .describe(
        'Array of immediate perception states that have not been processed yet. These represent the current sensory input to the agent.',
      ),
    dynamicState: AgentDynamicStateSchema,

    // Memory Context
    recentObservations: z
      .array(ObservationSchema)
      .describe('Previously processed (recent) observations retrieved from episodic memory.'),
    relatedFacts: z.array(FactSchema).describe('Raw relevant facts from semantic memory.'),

    // Agent's internal models (Placeholders)
    agentSelfConcept: SelfModelSchema.describe("Representation of the agent's self-model."),
    worldModel: WorldModelContextSchemaPlaceholder.describe(
      "Representation of the agent's relevant world knowledge/ontology.",
    ),

    // Other contextual info
    currentTime: z.number().int().positive().describe('Current simulation time (ms epoch).'),
    activeHypotheses: z
      .array(z.string())
      .optional()
      .describe('IDs or summaries of hypotheses currently under consideration.'),
  })
  .describe(
    'Comprehensive contextual information gathered during the Orient phase, used for planning and decision-making.',
  );

export type OrientationContext = z.infer<typeof OrientationContextSchema>;
