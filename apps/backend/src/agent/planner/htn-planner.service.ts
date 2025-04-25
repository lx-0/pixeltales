import { Inject, Injectable, Logger } from '@nestjs/common';
import { AgentAction, OrientationContext, PlanNode, PlanStatus } from '@pixeltales/contracts';
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
    // Inject LLM service for decomposition
    @Inject(AGENT_LLM_SERVICE) private readonly agentLlmService: IAgentLlmService,
    // Inject Memory interface for plan persistence
    @Inject(MEMORY_INTERFACE) private readonly memory: IMemoryInterface,
  ) {}

  /**
   * Decompose goal using LLM and return the first actionable step.
   */
  async generatePlan(
    agentId: string,
    goal: string,
    context: OrientationContext,
  ): Promise<AgentAction | null> {
    this.logger.debug(
      `[${agentId}] Planner received goal: "${goal}" with context (keys: ${Object.keys(context).join(', ')})`,
    );

    // --- Step 1: Decompose goal using LLM --- //
    let steps: string[] = [];
    try {
      steps = await this.agentLlmService.generatePlanSteps(agentId, goal, context);
    } catch (error) {
      this.logger.error(`[${agentId}] Error calling LLM for plan decomposition`, error);
      return null; // Fail planning if decomposition fails
    }

    if (!steps || steps.length === 0 || !steps[0]) {
      this.logger.warn(`[${agentId}] LLM decomposition returned no steps for goal: "${goal}"`);
      return null;
    }

    // --- Step 2: Store the plan in memory --- //
    let planId: string;
    try {
      // Create a plan with all steps in a single operation
      planId = await this.memory.createPlanWithNodes(agentId, goal, steps);
      this.logger.verbose(`[${agentId}] Stored plan ${planId} with ${steps.length} steps`);
    } catch (error) {
      this.logger.error(`[${agentId}] Error storing plan in memory`, error);
      planId = ''; // Continue even if persistence fails
    }

    // --- Step 3: Convert first step description to AgentAction --- //
    const firstStep = steps[0].toLowerCase().trim();
    this.logger.verbose(`[${agentId}] Planner attempting to execute first step: "${firstStep}"`);

    let generatedAction: AgentAction | null = null;
    const planContextValue = planId ? { planId, nodeId: 'NODE_ID_PLACEHOLDER' } : undefined; // TODO: Get actual Node ID

    // TODO: Use more robust parsing/mapping (maybe another LLM call)
    if (
      firstStep.includes('speak') ||
      firstStep.includes('say') ||
      firstStep.includes('tell') ||
      firstStep.includes('ask') ||
      firstStep.includes('greet') ||
      firstStep.includes('respond') ||
      firstStep.startsWith('introduce') ||
      firstStep.match(/conversation|talking|chat|discuss/)
    ) {
      // Extract content and tone from step description
      const content = steps[0]; // Use original formatting for content
      let tone = 'neutral';

      // Try to extract tone from content if specified
      const tonePatterns = [
        { regex: /\b(friendly|warm|kind|casual)\b/i, tone: 'friendly' },
        { regex: /\b(formal|professional|respectful|polite)\b/i, tone: 'formal' },
        { regex: /\b(excited|enthusiastic|energetic)\b/i, tone: 'excited' },
        { regex: /\b(curious|inquiring|questioning)\b/i, tone: 'curious' },
        { regex: /\b(cautious|careful|hesitant)\b/i, tone: 'cautious' },
      ];

      for (const pattern of tonePatterns) {
        if (content.match(pattern.regex)) {
          tone = pattern.tone;
          break;
        }
      }

      generatedAction = {
        type: 'speak',
        payload: {
          content: `(Plan: ${content})`,
          tone,
          planContext: planContextValue,
        },
      };
    } else if (
      firstStep.includes('move') ||
      firstStep.includes('go to') ||
      firstStep.includes('walk') ||
      firstStep.includes('approach') ||
      firstStep.includes('head to')
    ) {
      // Try to extract target location from step
      const locationPatterns = [
        /(?:move|go|walk|approach|head)\s+to\s+(?:the\s+)?([a-z0-9_\s]+)/i,
        /(?:move|go|walk|approach|head)\s+(?:towards|toward)\s+(?:the\s+)?([a-z0-9_\s]+)/i,
        /(?:at|to|in)\s+(?:the\s+)?([a-z0-9_\s]+)/i,
      ];

      let target = 'nearby'; // Default

      for (const pattern of locationPatterns) {
        const match = firstStep.match(pattern);
        if (match && match[1]) {
          target = match[1].trim();
          break;
        }
      }

      generatedAction = {
        type: 'move',
        payload: {
          target: target,
          pathfinding: 'shortest',
          planContext: planContextValue,
        },
      };
    } else if (
      firstStep.includes('interact') ||
      firstStep.includes('use') ||
      firstStep.includes('pick up') ||
      firstStep.includes('take')
    ) {
      // Try to extract object and interaction type
      const target =
        firstStep.match(/(?:with|use|pick up|take)\s+(?:the\s+)?([a-z0-9_\s]+)/i)?.[1]?.trim() ||
        'nearest object';
      const action =
        firstStep.includes('pick up') || firstStep.includes('take')
          ? 'pickup'
          : firstStep.includes('open')
            ? 'open'
            : firstStep.includes('close')
              ? 'close'
              : firstStep.includes('push')
                ? 'push'
                : firstStep.includes('pull')
                  ? 'pull'
                  : 'examine'; // Default interaction

      generatedAction = {
        type: 'interact',
        payload: {
          objectId: target,
          interactionType: action,
          planContext: planContextValue,
        },
      };
    } else {
      this.logger.warn(
        `[${agentId}] Planner could not map first step "${firstStep}" to a known action type.`,
      );

      // Default to speaking the step as a fallback
      generatedAction = {
        type: 'speak',
        payload: {
          content: `(I'll ${steps[0]})`,
          tone: 'neutral',
          planContext: planContextValue,
        },
      };
    }

    // --- Step 4: Return action --- //
    if (generatedAction) {
      this.logger.verbose(`[${agentId}] Planner generated action: ${generatedAction.type}`);
    } else {
      this.logger.log(
        `[${agentId}] Planner failed to generate actionable step for goal: "${goal}"`,
      );
    }

    return generatedAction;
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
