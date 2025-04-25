import { AgentAction, AgentState, OrientationContext } from '@pixeltales/contracts';

/**
 * Interface for the agent-specific LLM service.
 * Provides methods for agent cognitive functions requiring LLM calls.
 */
export interface IAgentLlmService {
  /**
   * Generates a direct AgentAction based on the current context (System-2 fallback).
   * @param agentId The ID of the agent.
   * @param context The current orientation context.
   * @param agentConfig Optional: The static config of the agent (e.g., for persona).
   * @returns A promise resolving to the generated AgentAction.
   */
  generateAction(
    agentId: string,
    context: OrientationContext,
    agentConfig?: AgentState['config'],
  ): Promise<AgentAction>;

  /**
   * Decomposes a high-level goal into a sequence of steps using the LLM.
   * @param agentId The ID of the agent.
   * @param goal The high-level goal description.
   * @param context The current orientation context.
   * @returns A promise resolving to an ordered array of step descriptions.
   */
  generatePlanSteps(agentId: string, goal: string, context: OrientationContext): Promise<string[]>;

  // TODO: Add other methods as needed, e.g.:
  // generatePlanDecomposition(agentId: string, goal: string, context: OrientationContext): Promise<PlanNode[]>;
  // summarizeMemory(agentId: string, observations: Observation[]): Promise<string>;
}

export const AGENT_LLM_SERVICE = Symbol('IAgentLlmService');
