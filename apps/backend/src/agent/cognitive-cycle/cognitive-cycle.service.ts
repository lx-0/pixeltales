import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  AddObservationParams,
  AgentAction,
  AgentDynamicState,
  AgentPerceptionEvent,
  AgentState,
  Fact,
  Observation,
  OrientationContext,
  PerceptionState,
  PlanNode,
  RewardFunctionInput,
  SelfModel,
} from '@pixeltales/contracts';
import { EVENT_BUS, IEventBus } from '../../core/event-bus.interface';
import { EventBusService } from '../../core/event-bus.service';
import { ACTION_SERVICE, IActionService } from '../action/action.interface';
import { AgentRuntimeState } from '../agent.state';
import {
  IInternalToolsInterface,
  INTERNAL_TOOLS_INTERFACE,
} from '../internal-tools/internal-tools.interface';
import { ILearningInterface, LEARNING_INTERFACE } from '../learning/learning.interface';
import { IRewardFunction, REWARD_FUNCTION } from '../learning/reward.function.interface';
import { AGENT_LLM_SERVICE, IAgentLlmService } from '../llm/agent-llm.interface';
import { IMemoryInterface, MEMORY_INTERFACE } from '../memory/memory.interface';
import { IPlannerService, PLANNER_SERVICE } from '../planner/planner.interface';
import { IReflectionService, REFLECTION_SERVICE } from '../reflection/reflection.interface';

// Define return type for cognitive cycle step
type CycleResult = {
  action: AgentAction;
  stateUpdates?: Partial<AgentDynamicState>;
};

/**
 * Coordinates the agent's Cognitive Cycle (Observe, Orient, Decide, Act).
 * Manages the flow between different cognitive subsystems.
 */
@Injectable()
export class CognitiveCycleService {
  private readonly logger = new Logger(CognitiveCycleService.name);

  constructor(
    @Inject(EVENT_BUS) private readonly eventBus: IEventBus,
    @Inject(MEMORY_INTERFACE) private readonly memoryInterface: IMemoryInterface,
    @Inject(PLANNER_SERVICE) private readonly plannerService: IPlannerService,
    @Inject(ACTION_SERVICE) private readonly actionService: IActionService,
    @Inject(INTERNAL_TOOLS_INTERFACE) private readonly internalTools: IInternalToolsInterface,
    @Inject(AGENT_LLM_SERVICE) private readonly agentLlmService: IAgentLlmService,
    @Inject(LEARNING_INTERFACE) private readonly learningInterface: ILearningInterface,
    @Inject(REWARD_FUNCTION) private readonly rewardFunction: IRewardFunction,
    @Inject(REFLECTION_SERVICE) private readonly reflectionService: IReflectionService,
  ) {}

  /**
   * Starts the cognitive loop for a given agent.
   */
  async startAgentLoop(agent: AgentState): Promise<void> {
    const agentId = agent.agentId;
    this.logger.log(`Starting loop for agent ${agentId}`);
    // TODO: Implement loop logic
  }

  /**
   * Stops the cognitive loop for an agent.
   */
  async stopAgentLoop(agent: AgentRuntimeState): Promise<void> {
    const agentId = agent.agentId;
    this.logger.log(`Stopping loop for agent ${agentId}`);
    // TODO: Implement logic to stop loops
  }

  /**
   * Processes a single perception event through the full cognitive cycle.
   * Returns the decided action and any resulting state updates.
   */
  async processPerceptionEvent(
    agent: AgentRuntimeState,
    perception: AgentPerceptionEvent,
  ): Promise<CycleResult> {
    const agentId = agent.agentId;
    this.logger.debug(`Agent ${agentId} processing perception type: ${perception?.type}`);
    const startTime = Date.now();

    try {
      // === 1. Observe ===
      this.logger.verbose(`[${agentId}] Observe Phase Start`);
      const observationTimestamp = perception.timestamp ? perception.timestamp : Date.now();

      // Type guard for perception content
      let contentString = 'No content';
      if ('content' in perception && perception.content) {
        contentString =
          typeof perception.content === 'string'
            ? perception.content
            : JSON.stringify(perception.content);
      }

      // Fix properties to match AddObservationParamsSchema
      const addObsParams: AddObservationParams = {
        timestamp: observationTimestamp, // Schema expects number
        eventType: perception.type,
        content: contentString,
        associatedVisualIds: perception.payload.sourceVisualId
          ? [perception.payload.sourceVisualId]
          : undefined, // Use visualIds
        metadata: perception.payload.metadata,
      };
      await this.memoryInterface.addObservation(agentId, addObsParams);
      this.logger.verbose(`[${agentId}] Logged perception to episodic memory.`);
      const observeTime = Date.now();
      this.eventBus.publish(
        EventBusService.createEvent(
          'CognitiveCycleService',
          'agent.cognitive.cycle.phase_completed',
          { agentId: agentId, phase: 'observe', durationMs: observeTime - startTime },
        ),
      );
      this.logger.verbose(`[${agentId}] Observe Phase End (${observeTime - startTime}ms)`);

      // === 2. Orient ===
      this.logger.verbose(`[${agentId}] Orient Phase Start`);
      const orientationContext = await this.gatherOrientationContext(agent, perception);
      const orientTime = Date.now();
      this.eventBus.publish(
        EventBusService.createEvent(
          'CognitiveCycleService',
          'agent.cognitive.cycle.phase_completed',
          { agentId: agentId, phase: 'orient', durationMs: orientTime - observeTime },
        ),
      );
      this.logger.verbose(`[${agentId}] Orient Phase End (${orientTime - observeTime}ms)`);

      // === 3. Decide & Plan ===
      this.logger.verbose(`[${agentId}] Decide/Plan Phase Start`);
      const stateBeforeDecision = { ...agent.dynamicState };
      const { action, stateUpdates } = await this.decideAndPlan(agent, orientationContext);
      const decideTime = Date.now();
      this.eventBus.publish(
        EventBusService.createEvent(
          'CognitiveCycleService',
          'agent.cognitive.cycle.phase_completed',
          {
            agentId: agentId,
            phase: 'decide',
            durationMs: decideTime - orientTime,
            actionType: action?.type ?? 'unknown',
          },
        ),
      );
      this.logger.verbose(`[${agentId}] Decide/Plan Phase End (${decideTime - orientTime}ms)`);

      // === 4. Act (Dispatch) ===
      this.logger.verbose(`[${agentId}] Act Phase Start`);
      if (action && action.type !== 'no_action') {
        await this.actionService.dispatchAction(agentId, action);

        // --- Log the executed action to Episodic Memory --- //
        try {
          const actionObsParams: AddObservationParams = {
            timestamp: Date.now(), // Use current time for action observation
            eventType: `agent.action.${action.type}`, // Specific event type for action
            content: JSON.stringify(action.payload), // Store action payload
            metadata: {
              actionType: action.type,
              source: 'agent_self',
              // Safely access planContext if it exists
              planContext: 'planContext' in action.payload ? action.payload.planContext : undefined,
            },
          };
          await this.memoryInterface.addObservation(agentId, actionObsParams);
          this.logger.verbose(`[${agentId}] Logged action ${action.type} to episodic memory.`);
        } catch (error) {
          this.logger.error(
            `[${agentId}] Failed to log action ${action.type} to episodic memory`,
            error instanceof Error ? error.stack : error,
          );
          // Continue even if logging fails
        }
        // --- End Action Logging --- //
      } else {
        this.logger.log(`[${agentId}] No action dispatched.`);
      }
      const actTime = Date.now();
      this.eventBus.publish(
        EventBusService.createEvent(
          'CognitiveCycleService',
          'agent.cognitive.cycle.phase_completed',
          { agentId: agentId, phase: 'act', durationMs: actTime - decideTime },
        ),
      );
      this.logger.verbose(`[${agentId}] Act Phase End (${actTime - decideTime}ms)`);

      // --- State Update & Reward Calculation --- //
      this.logger.verbose(`[${agentId}] Updating state and calculating reward...`);
      const currentDynamicState = { ...stateBeforeDecision, ...stateUpdates };
      agent.dynamicState = currentDynamicState;
      this.logger.debug(`[${agentId}] New dynamic state:`, currentDynamicState);

      // Construct input for reward function
      const rewardInput: RewardFunctionInput = {
        previousState: stateBeforeDecision,
        actionTaken: action,
        currentState: currentDynamicState,
        // Add specific TODOs for placeholder fields
        goalProgress: undefined, // TODO: Implement goal tracking and progress calculation (Task 4 / Task 7)
        conversationRating: undefined, // TODO: Implement conversation analysis (Task 18) or simpler sentiment check
        informationGain: undefined, // TODO: Get value from CuriosityService (Task 9)
      };

      // Compute reward
      const rewardScore = this.rewardFunction.compute(rewardInput);
      // Record reward using LearningInterface
      await this.learningInterface.recordReward(agent, action, rewardScore);
      this.logger.log(`[${agentId}] Recorded reward ${rewardScore} for action ${action.type}`);
      // --- End State Update & Reward --- //

      // Publish completion of the full cycle
      this.eventBus.publish(
        EventBusService.createEvent(
          'CognitiveCycleService',
          'agent.cognitive.cycle.phase_completed',
          { agentId: agentId, phase: 'cycle', durationMs: actTime - startTime },
        ),
      );
      this.logger.debug(`[${agentId}] Full Cognitive Cycle took ${actTime - startTime}ms`);

      return { action, stateUpdates };
    } catch (error) {
      this.logger.error(
        `[${agentId}] Error during cognitive cycle processing perception ${perception?.type}`,
        error instanceof Error ? error.stack : error,
      );
      this.eventBus.publish(
        EventBusService.createEvent('CognitiveCycleService', 'agent.cognitive.cycle.error', {
          agentId: agentId,
          error: error instanceof Error ? error.message : 'Unknown error',
          perceptionType: perception?.type,
        }),
      );
      // Return no_action and no state updates on error
      return { action: { type: 'no_action', payload: { reason: 'Cognitive cycle error' } } };
    }
  }

  // --- Helper methods for cycle phases (to be implemented) ---

  private async gatherOrientationContext(
    agent: AgentRuntimeState,
    currentPerception: AgentPerceptionEvent,
  ): Promise<OrientationContext> {
    const agentId = agent.agentId;
    this.logger.debug(
      `[${agentId}] Gathering orientation context for perception type: ${currentPerception.type}`,
    );

    // --- Retrieve Memories using MemoryInterface --- //
    let recentObservations: Observation[] = [];
    let relatedFacts: Fact[] = [];
    try {
      // Retrieve recent observations
      recentObservations = await this.memoryInterface.retrieveObservations(agentId, {
        limit: 10, // Example limit
        // Consider adding time filter based on last cycle?
      });
      this.logger.verbose(
        `[${agentId}] Retrieved ${recentObservations.length} recent observations.`,
      );

      // Retrieve facts related to the source of the perception, if available
      if (currentPerception.payload.sourceVisualId) {
        relatedFacts = await this.memoryInterface.retrieveFacts(agentId, {
          subjectVisualId: currentPerception.payload.sourceVisualId,
          limit: 5, // Example limit
        });
        this.logger.verbose(
          `[${agentId}] Retrieved ${relatedFacts.length} facts related to source ${currentPerception.payload.sourceVisualId}.`,
        );
      }
      // TODO: Potentially retrieve other relevant facts based on perception content/type?
    } catch (error) {
      this.logger.error(`[${agentId}] Error retrieving memories during orientation`, error);
      // Continue with potentially empty memories
    }

    // --- Get Agent Dynamic State --- //
    const currentDynamicState: AgentDynamicState = agent.dynamicState;
    this.logger.verbose(`[${agentId}] Current dynamic state: mood=${currentDynamicState.mood}`);

    // --- Consult Self-Model (via MemoryInterface) --- //
    let agentSelfConcept: SelfModel | undefined;
    try {
      // Use the getSelfConcept method which now reads from persistence
      agentSelfConcept = await this.memoryInterface.getSelfConcept(agentId);
      this.logger.verbose(`[${agentId}] Retrieved self-concept.`);
    } catch (error) {
      this.logger.error(`[${agentId}] Error retrieving self-concept`, error);
      // Continue without self-concept if retrieval fails
    }

    // --- Consult Ontology & Hypotheses (Placeholders) --- //
    // TODO: Integrate calls to OntologyService and CuriosityService when implemented
    const worldModelContextPlaceholder: any = {};
    const activeHypothesesPlaceholder: string[] = [];

    // Create perception states from current perception and agent's buffer
    const perceptionStates: PerceptionState[] = [];

    // First, convert the current perception being processed
    const currentPerceptionState = this.convertToPerceptionState(currentPerception);
    perceptionStates.push(currentPerceptionState);

    // Then add any pending perceptions from the agent's buffer
    const pendingPerceptions = agent.getAllPendingPerceptions();
    if (pendingPerceptions.length > 0) {
      for (const pendingPerception of pendingPerceptions) {
        perceptionStates.push(this.convertToPerceptionState(pendingPerception));
      }

      this.logger.verbose(
        `[${agentId}] Added ${perceptionStates.length} perceptions to context (1 current + ${pendingPerceptions.length} pending)`,
      );
    }

    // --- Construct Final Rich Context --- //
    const context: OrientationContext = {
      currentPerception: perceptionStates,
      recentObservations: recentObservations,
      relatedFacts: relatedFacts,
      dynamicState: currentDynamicState,
      // Use the retrieved self-concept, provide default if missing
      agentSelfConcept: agentSelfConcept ?? {
        capabilities: {},
        agencyBoundaries: {},
        role: { primaryRole: 'default' },
        selfAwareness: { nature: 'unknown', systemUnderstanding: 0.1 },
        lastUpdated: Date.now(),
      },
      worldModel: worldModelContextPlaceholder, // Placeholder
      currentTime: Date.now(),
      activeHypotheses: activeHypothesesPlaceholder, // Placeholder
    };

    this.logger.debug(`[${agentId}] Orientation context gathered successfully.`);
    return context;
  }

  /**
   * Helper method to convert an AgentPerceptionEvent to a PerceptionState
   */
  private convertToPerceptionState(perception: AgentPerceptionEvent): PerceptionState {
    // Extract content from payload based on event type
    let perceptionContent: string | Record<string, any> = 'No content';

    if (perception.type === 'perception.message' && perception.payload.content) {
      perceptionContent = perception.payload.content;
    } else if (perception.type === 'perception.scene_update' && perception.payload.description) {
      perceptionContent = perception.payload.description;
    } else {
      // For other event types, use the payload directly as content
      perceptionContent = perception.payload;
    }

    return {
      type: perception.type,
      content: perceptionContent,
      sourceVisualId: perception.payload.sourceVisualId,
      visualIds: perception.payload.sourceVisualId ? [perception.payload.sourceVisualId] : [],
      timestamp: perception.timestamp || Date.now(),
    };
  }

  /**
   * Determines the agent's next action based on the current orientation context.
   * This method orchestrates the core Decide & Plan phase of the cognitive cycle,
   * incorporating the dual-process (System-1/System-2) model.
   *
   * Steps:
   * 1.  **Cognitive Effort Allocation:** Determine if System-1 (fast, intuitive) or System-2 (slow, deliberative) processing is needed based on context (perception complexity, goals, relevance).
   * 2.  **System-2 Processing (if triggered):**
   *     a. Check for active `shortTermGoals`.
   *     b. If goal exists, call `plannerService.generatePlan` to get an `AgentPlan`.
   *     c. Persist the plan using `memoryInterface.createPlanWithNodes`.
   *     d. Get the next actionable `PlanNode` using `plannerService.getNextStep`.
   *     e. If a node is available, map it to an `AgentAction` using `mapPlanNodeToAction`.
   *     f. If planning yields an action, return it along with state updates (e.g., remove goal).
   *     g. **Fallback:** If no goal or planning failed, call `agentLlmService.generateAction` for a direct response.
   * 3.  **System-1 Processing (if System-2 not triggered):**
   *     a. Apply lightweight heuristics (e.g., check for greetings, questions).
   *     b. Consult recent memory (`internalTools['memory.retrieveObservations']`).
   *     c. Select a predefined simple response or default action.
   * 4.  **Final Action Determination:** Ensure a valid `AgentAction` (even `no_action`) is assigned.
   * 5.  **Idle Reflection Trigger:** If the final decision is `no_action`, asynchronously trigger `reflectionService.performReflection`.
   * 6.  **Return Result:** Return the determined `AgentAction` and any associated `stateUpdates`.
   *
   * @param agent The current runtime state of the agent.
   * @param context The orientation context gathered in the previous phase.
   * @returns A promise resolving to a CycleResult containing the action and state updates.
   */
  private async decideAndPlan(
    agent: AgentRuntimeState,
    context: OrientationContext,
  ): Promise<CycleResult> {
    const agentId = agent.agentId;
    this.logger.debug(`[${agentId}] Deciding action/plan`);

    // --- Cognitive Effort Allocator --- //
    let useSystem2 = false;
    let system2Reason = '';

    // 1. Check perception content length
    const perceptionContent = context.currentPerception
      .map((p) => (typeof p.content === 'string' ? p.content : JSON.stringify(p.content)))
      .join('; ');
    if (context.currentPerception && context.currentPerception.length > 0) {
      if (perceptionContent.length > 50) {
        useSystem2 = true;
        system2Reason = 'Perception content is long (> 50 chars)';
      }

      // Additional trigger: Multiple perceptions at once
      if (context.currentPerception.length > 1) {
        useSystem2 = true;
        system2Reason = 'Multiple simultaneous perceptions';
      }
    }

    // 2. Check if agent has active goals
    if (!useSystem2 && context.dynamicState?.shortTermGoals?.length > 0) {
      useSystem2 = true;
      system2Reason = 'Agent has active short-term goals';
    }

    // 3. Check if perception is highly relevant to agent's role or self-concept
    // (Requires more sophisticated analysis in a real system)
    // Example: Simple keyword check against role description
    // Use type assertion for agentSelfConcept before accessing properties
    const agentSelf = context.agentSelfConcept;
    const roleDescription = agentSelf?.role.primaryRole;
    if (!useSystem2 && perceptionContent && typeof roleDescription === 'string') {
      const keywords: string[] = roleDescription.toLowerCase().split(' ');
      const perceptionLower = perceptionContent.toLowerCase();
      if (
        keywords.some((keyword: string) => keyword.length > 3 && perceptionLower.includes(keyword))
      ) {
        useSystem2 = true;
        system2Reason = 'Perception seems relevant to agent role';
      }
    }

    // 4. Check curiosity/uncertainty levels (placeholder)
    // if (!useSystem2 && context.dynamicState.curiosityLevel > 0.7) { ... }

    if (useSystem2) {
      this.logger.verbose(`[${agentId}] Triggering System-2: ${system2Reason}`);
    }
    // --- End Allocator --- //

    // --- Decision Logic --- //
    let resultingAction: AgentAction = { type: 'no_action', payload: { reason: 'initial' } };
    let stateUpdates: Partial<AgentDynamicState> | undefined;

    if (useSystem2) {
      // === System-2: Deliberative Processing ===
      this.logger.verbose(`[${agentId}] Engaging System-2`);
      const currentGoals = context.dynamicState?.shortTermGoals ?? [];
      this.logger.debug(`[${agentId}] System-2 considering goals: ${JSON.stringify(currentGoals)}`);
      if (currentGoals.length > 0 && currentGoals[0]) {
        const selectedGoal = currentGoals[0];
        this.logger.verbose(`[${agentId}] Selected goal for planning: ${selectedGoal}`);
        // Retrieve semantic facts relevant to the goal
        let goalFacts: Fact[] = [];
        try {
          goalFacts = await this.internalTools['memory.retrieveFacts'](agentId, {
            query: selectedGoal,
            limit: 5,
          });
          this.logger.verbose(
            `[${agentId}] Retrieved ${goalFacts.length} semantic facts for goal.`,
          );
        } catch (error) {
          this.logger.error(
            `[${agentId}] Error retrieving semantic facts for goal planning`,
            error,
          );
        }
        // Merge new facts into planning context
        const planningContext: OrientationContext = {
          ...context,
          relatedFacts: [...context.relatedFacts, ...goalFacts],
        };

        // 1. Generate hierarchical AgentPlan using LLM
        const agentPlan = await this.plannerService.generatePlan(
          agentId,
          selectedGoal,
          planningContext,
        );

        // Check if plan generation failed or returned empty
        if (agentPlan.status === 'failed' || Object.keys(agentPlan.nodes).length === 0) {
          this.logger.warn(
            `[${agentId}] Plan generation failed or returned empty plan for goal: ${selectedGoal}. Falling back.`,
          );
          // Continue to LLM fallback below
        } else {
          // 2. Persist the Plan and its Nodes
          try {
            await this.memoryInterface.createPlan(agentId, agentPlan.goal, agentPlan.planId);
            await this.memoryInterface.addPlanNodes(
              agentPlan.planId,
              agentId,
              Object.values(agentPlan.nodes),
            );
            this.logger.verbose(
              `[${agentId}] Persisted plan ${agentPlan.planId} with ${Object.keys(agentPlan.nodes).length} nodes.`,
            );

            // 3. Get next actionable node
            const nextNode = await this.plannerService.getNextStep(agentPlan.planId);
            if (nextNode) {
              resultingAction = this.mapPlanNodeToAction(nextNode, agentPlan.planId);
              stateUpdates = {
                shortTermGoals: currentGoals.slice(1),
                mood: resultingAction.type === 'speak' ? 'engaging' : context.dynamicState.mood,
              };
              this.logger.verbose(
                `[${agentId}] Planner-generated action from node ${nextNode.id}. State update: remove goal.`,
              );
              // Don't return yet, fall through to final return
            } else {
              this.logger.verbose(
                `[${agentId}] Plan ${agentPlan.planId} created but no initial actionable node found (plan might be complete?).`,
              );
              // Plan might be immediately complete or stuck, treat as no_action for now
              resultingAction = {
                type: 'no_action',
                payload: { reason: 'Plan created but no next step' },
              };
            }
          } catch (persistError) {
            this.logger.error(
              `[${agentId}] Failed to persist plan ${agentPlan.planId}`,
              persistError,
            );
            // Failed to save plan, fallback to direct LLM
            resultingAction = { type: 'no_action', payload: { reason: 'Plan persistence error' } };
          }
        }
      }

      // Fallback to System-2 LLM generation if planning failed or no action derived
      if (resultingAction.type === 'no_action') {
        this.logger.debug(
          `[${agentId}] Planning did not yield an action, falling back to direct LLM generation...`,
        );
        try {
          this.logger.debug(`[${agentId}] Calling Agent LLM Service for action generation...`);
          const llmAction = await this.agentLlmService.generateAction(
            agentId,
            context,
            agent.config,
          );
          resultingAction = llmAction ?? {
            type: 'no_action',
            payload: { reason: 'LLM returned null' },
          };
          stateUpdates = { mood: 'thinking' };
          this.logger.verbose(
            `[${agentId}] System-2 LLM fallback action: ${llmAction?.type ?? 'null'}`,
          );
          // NO return here, fall through to final return
        } catch (error) {
          this.logger.error(
            `[${agentId}] Error during System-2 LLM fallback action generation`,
            error instanceof Error ? error.stack : error,
          );
          resultingAction = {
            type: 'no_action',
            payload: { reason: 'System-2 LLM Fallback Error' },
          };
          stateUpdates = {}; // Reset state updates on error?
        }
      } // End of LLM fallback check
    } else {
      // === System-1: Fast/Intuitive Processing ===
      this.logger.verbose(`[${agentId}] Engaging System-1`);

      // Example: Simple acknowledgment or default action
      // More sophisticated System-1 could involve basic sentiment check,
      // predefined social responses, or simple state updates.

      // Retrieve recent observations for quick context
      let recentSys1Obs: Observation[] = [];
      try {
        recentSys1Obs = await this.internalTools['memory.retrieveObservations'](agentId, {
          limit: 5,
        });
      } catch (error) {
        this.logger.error(`[${agentId}] System-1 memory retrieval error`, error);
      }

      // Apply light-weight heuristics
      const lower = perceptionContent.toLowerCase();
      const firstSys1Obs = recentSys1Obs[0];

      if (/\b(hello|hi|hey)\b/.test(lower)) {
        resultingAction = { type: 'speak', payload: { content: 'Hey there!' } };
        stateUpdates = { mood: 'friendly' };
      } else if (/\b(bye|goodbye|see you)\b/.test(lower)) {
        resultingAction = { type: 'speak', payload: { content: 'Goodbye!' } };
        stateUpdates = { mood: 'calm' };
      } else if (lower.endsWith('?')) {
        resultingAction = {
          type: 'speak',
          payload: { content: "That's an interesting question." },
        };
        stateUpdates = { mood: 'curious' };
      } else if (firstSys1Obs && firstSys1Obs.content.includes(perceptionContent)) {
        resultingAction = {
          type: 'speak',
          payload: { content: 'I think we just discussed that.' },
        };
        stateUpdates = { mood: 'thoughtful' };
      } else {
        resultingAction = { type: 'speak', payload: { content: 'Okay.' } };
        stateUpdates = {
          participationInterest: Math.max(
            0,
            (context.dynamicState.participationInterest ?? 0.5) - 0.01,
          ),
        };
      }

      this.logger.verbose(`[${agentId}] System-1 chose action: ${resultingAction.type}`);
      // NO return here, fall through to final return
    }

    // --- Trigger Reflection on Idle ---
    if (resultingAction.type === 'no_action') {
      this.logger.verbose(`[${agentId}] Agent decided no_action, triggering reflection (async).`);
      // Non-blocking call to reflection service
      this.reflectionService.performReflection(agentId, 'idle').catch((err) => {
        this.logger.error(`[${agentId}] Background reflection call failed:`, err);
      });
    }

    // --- Final Return ---
    this.logger.verbose(`[${agentId}] Final Decided Action: ${resultingAction.type}`);
    if (stateUpdates) {
      this.logger.verbose(`[${agentId}] Final State Updates: ${JSON.stringify(stateUpdates)}`);
    }
    return { action: resultingAction, stateUpdates };
  }

  /**
   * Convert a PlanNode to an AgentAction, preserving original mapping logic.
   */
  private mapPlanNodeToAction(node: PlanNode, planId: string): AgentAction {
    const desc = node.description;
    const firstStep = desc.toLowerCase().trim();
    const planContext = { planId, nodeId: node.id };
    // Simplified mapping logic (expand as needed)
    if (/\b(speak|say|tell|ask|greet|respond)\b/.test(firstStep)) {
      return { type: 'speak', payload: { content: desc, tone: 'neutral', planContext } };
    }
    if (/\b(move|go to|walk|approach|head to)\b/.test(firstStep)) {
      return { type: 'move', payload: { target: desc, pathfinding: 'shortest', planContext } };
    }
    if (/\b(interact|use|pick up|take)\b/.test(firstStep)) {
      return { type: 'interact', payload: { objectId: desc, interactionType: 'use', planContext } };
    }
    // Fallback
    return { type: 'speak', payload: { content: desc, tone: 'neutral', planContext } };
  }

  // TODO: Add methods for handling asynchronous operations and callbacks as per section 2.3.3
}
