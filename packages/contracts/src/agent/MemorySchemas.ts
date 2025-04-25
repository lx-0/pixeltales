import { z } from 'zod';

// Base Memory Schemas
export const ObservationSchema = z.object({
  id: z.string().uuid().describe('Unique identifier for the observation.'),
  timestamp: z.number().int().positive().describe('Timestamp when the observation was made.'),
  content: z.string().describe('Textual description of the observation.'),
  associatedVisualIds: z
    .array(z.string())
    .optional()
    .describe('Visual IDs of agents/objects related to the observation.'),
  metadata: z
    .record(z.string(), z.any())
    .optional()
    .describe('Additional context, e.g., source, modality.'),
});
export type Observation = z.infer<typeof ObservationSchema>;

export const FactSchema = z.object({
  id: z.string().uuid().describe('Unique identifier for the fact.'),
  subjectVisualId: z
    .string()
    .optional()
    .describe('Visual ID of the entity the fact is about (if applicable).'),
  key: z.string().describe('The property or attribute name.'),
  value: z.any().describe('The value of the fact.'),
  confidence: z.number().min(0).max(1).describe("Agent's confidence in the fact (0-1)."),
  lastUpdated: z
    .number()
    .int()
    .positive()
    .describe('Timestamp when the fact was last updated or confirmed.'),
  provenance: z
    .array(z.string())
    .optional()
    .describe('Source(s) of the fact (e.g., observation IDs, reflection report ID).'),
});
export type Fact = z.infer<typeof FactSchema>;

// Schemas for Memory Tool Calls (as defined in 2.7.2)
export const AddObservationParamsSchema = z.object({
  timestamp: z.number().int().positive().describe('Timestamp as ms epoch'),
  eventType: z.string().describe('Type of the event being observed.'),
  content: z.string(),
  conversationId: z.string().optional().describe('Optional ID of the conversation context.'),
  associatedVisualIds: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.any()).optional().describe('Optional structured metadata.'),
});
export type AddObservationParams = z.infer<typeof AddObservationParamsSchema>;

export const RetrieveObservationsParamsSchema = z.object({
  query: z.string().optional().describe('Semantic query string for searching observations.'),
  timeFilter: z
    .object({
      startTime: z.number().int().positive().optional(),
      endTime: z.number().int().positive().optional(),
    })
    .optional()
    .describe('Time range filter.'),
  eventType: z.string().optional().describe('Filter by specific event type.'),
  visualIdFilter: z.array(z.string()).optional().describe('Filter by associated visual IDs.'),
  limit: z
    .number()
    .int()
    .positive()
    .optional()
    .default(10)
    .describe('Maximum number of observations to return.'),
});
export type RetrieveObservationsParams = z.infer<typeof RetrieveObservationsParamsSchema>;

export const UpsertFactParamsSchema = z.object({
  subjectVisualId: z.string(),
  key: z.string(),
  value: z.any(),
  confidence: z.number().min(0).max(1),
});
export type UpsertFactParams = z.infer<typeof UpsertFactParamsSchema>;

export const RetrieveFactsParamsSchema = z.object({
  subjectVisualId: z.string().optional(),
  query: z.string().optional().describe('Semantic query string for searching facts.'),
  keyFilter: z.array(z.string()).optional().describe('Filter by specific fact keys.'),
  minConfidence: z.number().min(0).max(1).optional().describe('Minimum confidence threshold.'),
  limit: z
    .number()
    .int()
    .positive()
    .optional()
    .default(10)
    .describe('Maximum number of facts to return.'),
});
export type RetrieveFactsParams = z.infer<typeof RetrieveFactsParamsSchema>;
