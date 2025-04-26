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
   * Decompose a high-level goal into a full HTN plan object.
   */
  async generatePlan(
    agentId: string,
    goal: string,
    context: OrientationContext,
  ): Promise<AgentPlan> {
    this.logger.debug(
      `[${agentId}] Planner received goal: "${goal}" with context (keys: ${Object.keys(
        context,
      ).join(', ')})`,
    );

    // --- Step 1: Decompose goal using LLM --- //
    let steps: string[] = [];
    try {
      steps = await this.agentLlmService.generatePlanSteps(agentId, goal, context);
    } catch (error) {
      this.logger.error(`[${agentId}] Error calling LLM for plan decomposition`, error);
      throw error;
    }

    if (!steps || steps.length === 0 || !steps[0]) {
      this.logger.warn(`[${agentId}] LLM decomposition returned no steps for goal: "${goal}"`);
      // Return an empty plan structure
      return {
        planId: uuid(),
        goal,
        rootNodeId: '',
        nodes: {},
        creationTimestamp: Date.now(),
        status: 'active',
      };
    }

    // --- Step 2: Build full plan object --- //
    const planId = uuid();
    const nodes: Record<string, PlanNode> = {};
    steps.forEach((description, index) => {
      const nodeId = uuid();
      nodes[nodeId] = {
        id: nodeId,
        parentId: undefined,
        description,
        status: index === 0 ? 'in_progress' : 'pending',
        taskType: 'primitive',
      };
    });
    const rootNodeId = Object.keys(nodes)[0]!;
    const agentPlan: AgentPlan = {
      planId,
      goal,
      rootNodeId,
      nodes,
      creationTimestamp: Date.now(),
      status: 'active',
    };
    this.logger.verbose(
      `[${agentId}] Planner created AgentPlan ${planId} with ${steps.length} nodes`,
    );

    // --- Step 3: Return full plan --- //
    return agentPlan;
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
