import { Position } from '@pixeltales/database';
import { z } from 'zod';

/**
 * Defines the core structure for an agent's internal dynamic state,
 * which evolves throughout the conversation.
 */
export const AgentDynamicStateSchema = z
  .object({
    mood: z.string().describe('Current emotional state of the agent.'),
    participationInterest: z
      .number()
      .min(0)
      .max(1)
      .describe("Agent's current interest level in participating (0-1)."),
    currentFocus: z
      .string()
      .optional()
      .describe('The current entity or topic the agent is focused on.'),
    shortTermGoals: z.array(z.string()).describe('List of immediate goals the agent is pursuing.'),
    curiosityLevel: z.number().min(0).max(1).describe("Agent's current level of curiosity (0-1)."),
    uncertaintyMetrics: z
      .record(z.string(), z.number().min(0).max(1))
      .describe("Record tracking agent's confidence in different knowledge areas."),
    selfConcept: z.string().describe("A summary or reference to the agent's current self-model."),
    // Add placeholder for agent position
    currentPosition: z
      .custom<Position>()
      .optional()
      .describe('Current coordinates of the agent in the scene.'),
    // Potentially add system-1 state if needed, e.g., last reaction type
  })
  .describe(
    'The dynamic internal state of an agent, including mood, goals, and cognitive variables.',
  );

export type AgentDynamicState = z.infer<typeof AgentDynamicStateSchema>;

/**
 * Defines the static configuration for an agent, set at creation.
 */
export const AgentConfigSchema = z
  .object({
    llmConfig: z
      .record(z.string(), z.any())
      .describe('Configuration for the language model used by the agent.'), // Define more specific structure if possible
    personalityCore: z.string().describe('Core personality description or prompt for the agent.'),
    visualDescription: z.string().describe("Textual description of the agent's appearance."),
    initialGoals: z
      .array(z.string())
      .optional()
      .describe('Optional initial goals set at agent creation.'),
    allowedTools: z
      .array(z.string())
      .optional()
      .describe('List of internal tools the agent is permitted to use.'),
  })
  .describe('Static configuration for an agent, defined at spawn time.');

export type AgentConfig = z.infer<typeof AgentConfigSchema>;

/**
 * Represents the complete state of an agent, combining static config and dynamic state.
 */
export const AgentStateSchema = z
  .object({
    agentId: z.string().uuid().describe('Unique identifier for the agent.'),
    config: AgentConfigSchema,
    dynamicState: AgentDynamicStateSchema,
  })
  .describe('Complete state representation of an agent instance.');

export type AgentState = z.infer<typeof AgentStateSchema>;
