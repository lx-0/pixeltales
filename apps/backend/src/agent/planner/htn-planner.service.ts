import { Inject, Injectable, Logger } from '@nestjs/common';
import { AgentPlan, OrientationContext, PlanNode, PlanStatus, uuid } from '@pixeltales/contracts';
import { AGENT_LLM_SERVICE, IAgentLlmService } from '../llm/agent-llm.interface';
import { IMemoryInterface, MEMORY_INTERFACE } from '../memory/memory.interface';
import { IPlannerService } from './planner.interface';

/**
 * Implementation of the HTN (Hierarchical Task Network) Planner Service.
 * Uses LLM for decomposition, returns first step as action (placeholder).
 */
@Injectable()
export class HtnPlannerService implements IPlannerService {
  private readonly logger = new Logger(HtnPlannerService.name);

  constructor(
    @Inject(AGENT_LLM_SERVICE) private readonly agentLlmService: IAgentLlmService,
    @Inject(MEMORY_INTERFACE) private readonly memory: IMemoryInterface,
  ) {}

  /**
   * Generates a hierarchical plan (AgentPlan) for a given goal using the LLM service.
   * This service acts as a thin wrapper or potential future location for
   * adding non-LLM based planning logic or plan caching.
   */
  async generatePlan(
    agentId: string,
    goal: string,
    context: OrientationContext,
  ): Promise<AgentPlan> {
    this.logger.debug(`[${agentId}] HtnPlannerService: generatePlan called for goal: "${goal}"`);

    // Delegate the core plan generation (decomposition) to the LLM service
    try {
      const agentPlan = await this.agentLlmService.generatePlanSteps(agentId, goal, context);
      this.logger.verbose(`[${agentId}] LLM Service returned plan ${agentPlan.planId}`);
      return agentPlan;
    } catch (error) {
      this.logger.error(`[${agentId}] Error generating plan via LLM Service`, error);
      // Propagate the error or return a failed plan structure?
      // Returning a minimal failed plan for now.
      return {
        planId: uuid(), // Generate a new UUID even for failed plan
        goal,
        rootNodeId: '',
        nodes: {},
        creationTimestamp: Date.now(),
        status: 'failed', // Mark as failed
      };
    }
  }

  /**
   * Retrieves the plan and finds the next actionable node based on current state.
   * @param planId ID of the plan to process.
   * @param currentState Optional current state snapshot for precondition checking.
   * @returns The next actionable PlanNode or null if plan is complete/stuck.
   */
  async getNextStep(planId: string, currentState?: any): Promise<PlanNode | null> {
    this.logger.debug(`HTNPlanner: Getting next step for plan ${planId}`);

    try {
      // Use memory service to retrieve next node
      return await this.memory.getNextPlanNode(planId);
    } catch (error) {
      this.logger.error(`Error retrieving next step for plan ${planId}`, error);
      return null;
    }
  }

  /**
   * Updates the status of a specific node within a plan.
   * @param planId ID of the plan containing the node.
   * @param nodeId ID of the node to update.
   * @param status The new status (e.g., 'completed', 'failed').
   * @param executionResult Optional result data from the node's execution.
   */
  async updateNodeStatus(
    planId: string,
    nodeId: string,
    status: PlanStatus,
    executionResult?: any,
  ): Promise<void> {
    this.logger.debug(
      `HTNPlanner: Updating node ${nodeId} in plan ${planId} to status ${status}`,
      executionResult ? 'with result' : 'without result',
    );

    try {
      // Use memory service to update node status
      await this.memory.updatePlanNodeStatus(planId, nodeId, status, executionResult);
    } catch (error) {
      this.logger.error(`Error updating node ${nodeId} status`, error);
      throw error;
    }
  }

  /**
   * Handles a failure during plan execution, potentially triggering replanning.
   * @param planId ID of the failed plan.
   * @param failedNodeId ID of the node that failed.
   * @param failureReason Optional reason for failure.
   * @returns A new plan (array of PlanNode) if replanning is successful, otherwise null.
   */
  async handlePlanFailure(
    planId: string,
    failedNodeId: string,
    failureReason?: string,
  ): Promise<PlanNode[] | null> {
    this.logger.error(
      `HTNPlanner: Handling failure for node ${failedNodeId} in plan ${planId}. Reason: ${failureReason}`,
    );

    try {
      // Mark the failed node
      await this.memory.updatePlanNodeStatus(planId, failedNodeId, 'failed', {
        reason: failureReason,
      });

      // Create a replan
      const newPlanId = await this.memory.createReplan(planId, failureReason || 'Unknown error');

      // For now, just return empty array since we don't have actual replanning logic yet
      // In the future, we would retrieve the nodes of the new plan
      return [];
    } catch (error) {
      this.logger.error(`Error handling plan failure for plan ${planId}`, error);
      return null;
    }
  }
}
