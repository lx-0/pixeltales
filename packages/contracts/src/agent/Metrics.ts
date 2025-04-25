import { z } from 'zod';

// Unified Metric type for storage adapters
export const MetricSchema = z.object({
  name: z.string().describe('The name of the metric (e.g., agent_response_time, memory_reads)'),
  tags: z
    .record(z.string(), z.string())
    .describe('Key-value pairs for dimensions (e.g., { agentId: "Alice", actionType: "speak" })'),
  fields: z
    .record(z.string(), z.number()) // NOTE: Currently only numbers allowed
    .describe('The actual measurements (e.g., { durationMs: 4500, tokensUsed: 120 }) '),
  timestamp: z
    .number()
    .int()
    .positive()
    .describe('Unix timestamp in milliseconds when the metric occurred'),
});
export type Metric = z.infer<typeof MetricSchema>;

// Example schema for a single metric point (align with TimeSeriesDB requirements)
export const MetricPointSchema = z
  .object({
    measurement: z
      .string()
      .describe('Name of the metric (e.g., agent_response_time, memory_reads)'),
    tags: z
      .record(z.string(), z.string())
      .describe('Tags for filtering/grouping (e.g., agentId, actionType, conversationId)'),
    fields: z
      .record(z.string(), z.number())
      .describe('Field values for the metric (e.g., durationMs, count, value)'),
    timestamp: z
      .number()
      .int()
      .positive()
      .describe('Timestamp of the metric measurement (e.g., in milliseconds)'),
  })
  .describe(
    'Represents a single data point for statistical measurement and analytics, suitable for TimeSeriesDB.',
  );

export type MetricPoint = z.infer<typeof MetricPointSchema>;

// Define specific event schemas used for generating metrics if needed, e.g.:
export const AgentActionEventMetricsSchema = z.object({
  eventType: z.literal('agent.action'),
  conversationId: z.string(),
  agentId: z.string(),
  actionType: z.enum([
    'speak',
    'think',
    'tool',
    'idle',
    'move',
    'interact',
    'update_state',
    'no_action',
    'experiment',
  ]),
  durationMs: z.number(),
  timestamp: z.number(),
  tokenUsage: z.number().optional(),
  llmModel: z.string().optional(),
});

export type AgentActionEventMetrics = z.infer<typeof AgentActionEventMetricsSchema>;

// Add other event types relevant for metrics (StepTiming, MemoryEvent, RewardEvent etc.)
