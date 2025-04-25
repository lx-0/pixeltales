import { z } from 'zod';

// Note: These schemas represent the data structure for EXTERNAL analysis.
// The agent itself does not access or use this information directly.

/**
 * Schema for representing a psychological profile based on external evaluation.
 */
export const PsychProfileSchema = z
  .object({
    agentId: z.string().uuid().describe('ID of the agent being profiled.'),
    timestamp: z.number().int().positive().describe('Timestamp of the evaluation.'),
    evaluationFramework: z
      .enum(['BigFive', 'MBTI', 'MMPI-2', 'TransactionalAnalysis'])
      .describe('The psychological framework used for this evaluation.'),
    scores: z
      .record(z.string(), z.number().or(z.string()))
      .describe(
        'Quantitative or categorical scores based on the framework (e.g., { "Openness": 78, "InteractionStyle": "Adult" }).',
      ),
    narrativeSummary: z
      .string()
      .optional()
      .describe("Qualitative summary of the agent's psychological state or tendencies."),
    behavioralPatterns: z
      .array(z.string())
      .optional()
      .describe('Observed recurring behavioral patterns.'),
  })
  .describe(
    'Structure for storing the results of an external psychological evaluation of an agent.',
  );

export type PsychProfile = z.infer<typeof PsychProfileSchema>;

/**
 * Schema for representing the relationship between two agents.
 */
const RelationshipEdgeSchema = z.object({
  targetAgentId: z.string().uuid(),
  attributes: z
    .record(z.string(), z.number().or(z.string()))
    .describe(
      'Quantified relationship attributes (e.g., { "trust": 0.78, "dominance": 0.2, "interactionType": "supportive" }).',
    ),
  trend: z
    .string()
    .optional()
    .describe(
      'Short description of the recent trend in the relationship (e.g., "increasing trust").',
    ),
});

/**
 * Schema for representing the social graph of inter-agent relationships.
 */
export const RelationshipGraphSchema = z
  .object({
    sceneId: z.string().uuid().describe('ID of the scene this graph applies to.'),
    timestamp: z.number().int().positive().describe('Timestamp of the graph snapshot.'),
    agentRelationships: z
      .record(
        z.string().uuid(), // Source Agent ID
        z.array(RelationshipEdgeSchema), // Array of relationships from the source agent
      )
      .describe('Map representing the directed graph of agent relationships.'),
    // Optional: Add overall group metrics
    groupMetrics: z
      .object({
        cohesion: z.number().min(0).max(1).optional(),
        conflictLevel: z.number().min(0).max(1).optional(),
      })
      .optional()
      .describe('Metrics describing the overall group dynamics.'),
  })
  .describe(
    'Structure for representing the social graph and relationship dynamics between agents in a scene, derived from external analysis.',
  );

export type RelationshipGraph = z.infer<typeof RelationshipGraphSchema>;
