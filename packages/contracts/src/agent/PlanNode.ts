import { z } from 'zod';

/**
 * Represents a single node in a Hierarchical Task Network (HTN).
 */
export const PlanNodeSchema = z
  .object({
    id: z.string().uuid().describe('Unique identifier for this plan node.'),
    parentId: z
      .string()
      .uuid()
      .optional()
      .describe('Identifier of the parent node, if this is a sub-task.'),
    description: z
      .string()
      .describe('Human-readable description of the task or goal represented by this node.'),
    status: z
      .enum(['pending', 'in_progress', 'completed', 'failed', 'cancelled'])
      .default('pending')
      .describe('Current status of this plan node.'),
    taskType: z
      .enum(['primitive', 'compound'])
      .describe(
        'Whether this is a leaf node (primitive) or requires further decomposition (compound).',
      ),
    // Optional: Store the actual tool call if this is a primitive action
    toolCall: z
      .object({
        toolName: z.string(),
        arguments: z.record(z.string(), z.any()),
      })
      .optional()
      .describe('If primitive, the specific tool call to execute.'),
    // Optional: Store constraints like ordering or preconditions
    constraints: z
      .record(z.string(), z.any())
      .optional()
      .describe('Constraints associated with this task (e.g., preconditions, ordering).'),
    // Optional: Track execution attempts and results
    executionHistory: z
      .array(
        z.object({
          timestamp: z.number(),
          outcome: z.enum(['success', 'failure', 'error']),
          details: z.string().optional(),
        }),
      )
      .optional()
      .describe('History of execution attempts for this node.'),
  })
  .describe('A node within a Hierarchical Task Network, representing a task or sub-goal.');

export type PlanNode = z.infer<typeof PlanNodeSchema>;
