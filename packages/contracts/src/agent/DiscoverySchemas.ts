import { z } from 'zod';
import { FactSchema } from './MemorySchemas'; // Import FactSchema
import { PlanNodeSchema } from './PlanNode'; // Corrected import path

/**
 * Schema for agent-generated hypotheses about the world or other agents.
 */
export const HypothesisSchema = z
  .object({
    id: z.string().uuid().describe('Unique identifier for the hypothesis.'),
    content: z.string().describe('The statement of the hypothesis.'),
    domain: z
      .string()
      .describe('The knowledge domain the hypothesis belongs to (e.g., physics, social_dynamics).'),
    confidence: z
      .number()
      .min(0)
      .max(1)
      .describe("Agent's current confidence in the hypothesis (0-1)."),
    supportingEvidence: z
      .array(z.string())
      .optional()
      .describe('IDs of observations or facts supporting this hypothesis.'),
    contradictingEvidence: z
      .array(z.string())
      .optional()
      .describe('IDs of observations or facts contradicting this hypothesis.'),
    creationTimestamp: z.number().int().positive(),
    lastTestedTimestamp: z.number().int().positive().optional(),
  })
  .describe('Structure for an agent-generated hypothesis.');

export type Hypothesis = z.infer<typeof HypothesisSchema>;

/**
 * Schema for designing and tracking experiments to test hypotheses.
 */
export const ExperimentSchema = z
  .object({
    id: z.string().uuid().describe('Unique identifier for the experiment.'),
    hypothesisId: z
      .string()
      .uuid()
      .describe('ID of the hypothesis this experiment is designed to test.'),
    description: z.string().describe('Description of the experimental procedure.'),
    // Link to the plan generated to execute this experiment
    plan: z
      .array(PlanNodeSchema)
      .optional()
      .describe('The plan (HTN) designed to execute this experiment.'),
    expectedOutcome: z
      .string()
      .describe('What the agent expects to observe if the hypothesis is true.'),
    status: z.enum(['planned', 'in_progress', 'completed', 'failed', 'aborted']).default('planned'),
    creationTimestamp: z.number().int().positive(),
    completionTimestamp: z.number().int().positive().optional(),
  })
  .describe('Structure for designing and tracking an experiment to test a hypothesis.');

export type Experiment = z.infer<typeof ExperimentSchema>;

/**
 * Schema for recording the results of an experiment.
 */
export const ExperimentResultSchema = z
  .object({
    experimentId: z.string().uuid().describe('ID of the experiment these results are for.'),
    outcome: z.string().describe('Description of what was actually observed.'),
    interpretation: z
      .string()
      .describe("Agent's interpretation of the results in relation to the hypothesis."),
    confidenceUpdate: z
      .object({
        hypothesisId: z.string().uuid(),
        newConfidence: z.number().min(0).max(1),
      })
      .describe('How the experiment outcome updated the confidence in the tested hypothesis.'),
    derivedFacts: z
      .array(FactSchema)
      .optional()
      .describe('New facts derived from the experiment results.'), // Use FactSchema here
    timestamp: z.number().int().positive(),
  })
  .describe('Structure for recording the results and interpretation of an experiment.');

export type ExperimentResult = z.infer<typeof ExperimentResultSchema>;

/**
 * Schema for defining ontological concepts (categories, instances).
 * Canonical definition.
 */
export const ConceptSchema = z
  .object({
    id: z.string().uuid().describe('Unique identifier for the concept.'),
    name: z.string().describe('Human-readable name of the concept.'),
    description: z.string().optional().describe('Optional description of the concept.'),
    category: z.string().optional().describe('Parent category ID or name, forming the hierarchy.'),
    properties: z
      .record(z.string(), z.any())
      .optional()
      .describe('Key-value pairs representing properties of this concept.'),
    confidence: z
      .number()
      .min(0)
      .max(1)
      .default(1.0)
      .describe('Confidence in the existence or definition of this concept.'),
    isInstance: z
      .boolean()
      .default(false)
      .describe('True if this represents a specific instance, false if a category/type.'),
    provenance: z
      .array(z.string())
      .optional()
      .describe('Source(s) of this concept (e.g., observation IDs).'),
    createdAt: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Timestamp when the concept was created (ms epoch).'),
    lastUpdated: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Timestamp when the concept was last updated (ms epoch).'),
  })
  .describe('Structure for representing an ontological concept or instance.');

export type Concept = z.infer<typeof ConceptSchema>;

// --- Concept Parameter Schemas ---

export const UpsertConceptParamsSchema = z
  .object({
    name: z.string().describe('The name of the concept to add or update.'),
    description: z.string().optional(),
    category: z.string().optional(),
    properties: z.record(z.string(), z.any()).optional(),
    confidence: z.number().min(0).max(1).optional(),
    isInstance: z.boolean().optional().describe("Specify if it's an instance (defaults to false)."),
    provenance: z.array(z.string()).optional(),
  })
  .describe('Parameters for adding or updating a concept.');
export type UpsertConceptParams = z.infer<typeof UpsertConceptParamsSchema>;

export const RetrieveConceptsParamsSchema = z
  .object({
    query: z.string().optional().describe('Semantic query or name match.'),
    category: z.string().optional().describe('Filter by category.'),
    isInstance: z.boolean().optional().describe('Filter by instance/concept flag.'),
    minConfidence: z.number().min(0).max(1).optional().describe('Minimum confidence threshold.'),
    limit: z
      .number()
      .int()
      .positive()
      .optional()
      .default(10)
      .describe('Maximum results to return.'),
  })
  .describe('Parameters for retrieving concepts.');
export type RetrieveConceptsParams = z.infer<typeof RetrieveConceptsParamsSchema>;

/**
 * Schema for defining semantic relationships between concepts.
 */
export const RelationSchema = z
  .object({
    id: z.string().uuid().describe('Unique identifier for the relation instance.'),
    sourceConceptId: z.string().uuid().describe('ID of the source concept.'),
    relationType: z.string().describe('Type of relationship (e.g., is_a, has_a, causes, part_of).'),
    targetConceptId: z.string().uuid().describe('ID of the target concept.'),
    strength: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .describe('Strength or confidence in the relationship (0-1).'),
    context: z.string().optional().describe('Optional context in which this relation holds true.'),
    // Optional: Link to supporting evidence
    provenance: z.array(z.string()).optional(),
  })
  .describe('Structure for representing a semantic relationship between two concepts.');

export type Relation = z.infer<typeof RelationSchema>;

/**
 * Schema representing the agent's self-model.
 */
export const SelfModelSchema = z
  .object({
    capabilities: z
      .record(z.string(), z.object({ confidence: z.number().min(0).max(1) }))
      .describe(
        'Agent\'s assessment of its own capabilities (e.g., { "solve_puzzle": { confidence: 0.8 } }).',
      )
      .optional()
      .default({}),
    agencyBoundaries: z
      .record(z.string(), z.any())
      .describe('Agent\'s perceived boundaries (e.g., { "cannot_access_internet": true }).')
      .optional()
      .default({}),
    role: z
      .object({
        primaryRole: z.string(),
        context: z.string().optional(),
        limitations: z.array(z.string()).optional(),
      })
      .describe("Agent's understanding of its character role.")
      .optional()
      .default({ primaryRole: 'default' }),
    selfAwareness: z
      .object({
        nature: z.string(),
        purpose: z.string().optional(),
        systemUnderstanding: z.number().min(0).max(1),
      })
      .describe("Metacognitive aspects of the agent's self-understanding.")
      .optional()
      .default({ nature: 'unknown', systemUnderstanding: 0.1 }),
    lastUpdated: z
      .number()
      .int()
      .positive()
      .describe('Timestamp when the model was last updated (ms epoch).'),
  })
  .describe("Represents the agent's explicit model of itself...");
export type SelfModel = z.infer<typeof SelfModelSchema>;
