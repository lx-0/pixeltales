import { z } from 'zod';
import { AgentActionSchema } from './AgentAction';
import { AgentDynamicStateSchema } from './AgentState';

/**
 * Defines the input data structure for the reward function calculation.
 */
export const RewardFunctionInputSchema = z
  .object({
    previousState: AgentDynamicStateSchema.optional().describe('Agent state before the action.'),
    actionTaken: AgentActionSchema.describe('The action performed by the agent.'),
    currentState: AgentDynamicStateSchema.describe('Agent state after the action/observation.'),
    // Optional inputs based on context
    goalProgress: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .describe('Normalized progress made towards the current goal (0-1).'),
    conversationRating: z
      .number()
      .min(-1)
      .max(1)
      .optional()
      .describe('Rating of the last conversational exchange (-1 to 1).'),
    externalFeedback: z
      .any()
      .optional()
      .describe('Explicit feedback from users or environment (structure TBD).'),
    informationGain: z
      .number()
      .min(0)
      .optional()
      .describe('Measure of new information acquired (e.g., from Curiosity System).'),
  })
  .describe('Input data for calculating agent rewards.');

export type RewardFunctionInput = z.infer<typeof RewardFunctionInputSchema>;

// Add other Learning-related schemas here if needed in the future
