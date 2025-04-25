import { AgentAction, OrientationContext, PlanNode } from '@pixeltales/contracts';

/**
 * Planner Service interface for HTN planning
 * (Backend specific interface)
 */
export interface IPlannerService {
  /**
   * Generate the next actionable step (AgentAction) for a given goal and context.
   * @param agentId The ID of the agent requesting the plan/action.
   * @param goal The high-level goal description.
   * @param context The current orientation context for the agent.
   * @returns A promise resolving to the next AgentAction, or null if no immediate action derived.
   */
  generatePlan(
    agentId: string,
    goal: string,
    context: OrientationContext,
  ): Promise<AgentAction | null>;

  /**
   * Retrieves the next actionable step from a given plan ID or state.
   * @param planId The ID of the plan to get the next step for.
   * @param currentState Optional current state snapshot to check preconditions.
   * @returns A promise resolving to the next actionable PlanNode or null if plan is complete/stuck.
   */
  getNextStep(planId: string, currentState?: any): Promise<PlanNode | null>;

  /**
   * Updates the status of a plan node after execution.
   * @param planId The ID of the plan containing the node.
   * @param nodeId The ID of the node to update.
   * @param status The new status ('completed', 'failed', etc.).
   * @param executionResult Optional details about the execution outcome.
   */
  updateNodeStatus(
    planId: string,
    nodeId: string,
    status: PlanNode['status'],
    executionResult?: any,
  ): Promise<void>;

  /**
   * Handles plan execution failure and attempts to replan or find alternatives.
   * @param planId The ID of the failed plan.
   * @param failedNodeId The ID of the node that failed.
   * @param failureReason Optional reason for failure.
   * @returns A promise resolving to a new plan (array of PlanNode) or null if replanning failed.
   */
  handlePlanFailure(
    planId: string,
    failedNodeId: string,
    failureReason?: string,
  ): Promise<PlanNode[] | null>;
}

// Define injection token if using NestJS dependency injection
export const PLANNER_SERVICE = Symbol('IPlannerService');
