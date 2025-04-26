import {
  AgentAction,
  AgentPlan,
  AgentState,
  Observation,
  OrientationContext,
  ReflectionReport,
} from '@pixeltales/contracts';

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
   * Decomposes a high-level goal into a hierarchical plan (HTN) structure using the LLM.
   * @param agentId The ID of the agent.
   * @param goal The high-level goal description.
   * @param context The current orientation context.
   * @returns A promise resolving to the full AgentPlan structure.
   */
  generatePlanSteps(agentId: string, goal: string, context: OrientationContext): Promise<AgentPlan>;

  /**
   * Analyzes recent experiences to generate higher-level insights for reflection.
   * @param agentId The ID of the agent.
   * @param observations The recent observations to analyze.
   * @returns A promise resolving to an array of generated insights, matching the structure expected by ReflectionReportSchema.
   */
  analyzeExperiencesForInsights(
    agentId: string,
    observations: Observation[],
  ): Promise<ReflectionReport['insights']>;

  // TODO: Add other methods as needed, e.g.:
  // generatePlanDecomposition(agentId: string, goal: string, context: OrientationContext): Promise<PlanNode[]>;
  // summarizeMemory(agentId: string, observations: Observation[]): Promise<string>;
}

export const AGENT_LLM_SERVICE = Symbol('IAgentLlmService');
