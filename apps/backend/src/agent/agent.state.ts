import {
  AgentConfig,
  AgentDynamicState,
  AgentPerceptionEvent,
  PlanNode,
} from '@pixeltales/contracts';

/**
 * Represents the runtime state of an active agent instance.
 * This might hold more than just the dynamic state schema, including references
 * to active plans, working memory content, etc.
 */
export class AgentRuntimeState {
  public readonly agentId: string;
  public readonly config: AgentConfig;
  public dynamicState: AgentDynamicState;

  // Potential additions for runtime management:
  public currentPlanId?: string;
  public activePlanNodes?: PlanNode[];
  public workingMemoryContent?: any; // Define a specific structure later
  public lastPerceptionTimestamp?: number;
  public isProcessing: boolean = false; // Flag to prevent concurrent processing

  // Perception buffer for unprocessed perceptions
  public perceptionBuffer: AgentPerceptionEvent[] = [];
  public lastActivityTimestamp: number; // Added to track last action/perception

  constructor(agentId: string, config: AgentConfig, initialState: AgentDynamicState) {
    this.agentId = agentId;
    this.config = config;
    this.dynamicState = initialState;
    this.lastActivityTimestamp = Date.now(); // Initialize on creation
  }

  /**
   * Updates the dynamic state safely by merging updates.
   * @param updates Partial updates to apply.
   */
  updateDynamicState(updates: Partial<AgentDynamicState>): void {
    // Ensure updates is an object
    if (updates && typeof updates === 'object') {
      this.dynamicState = { ...this.dynamicState, ...updates };
      this.lastActivityTimestamp = Date.now(); // Update activity on state change too
    } else {
      // Log a warning if updates is not a valid object (or handle as needed)
      console.warn(`[AgentRuntimeState ${this.agentId}] Received invalid state updates:`, updates);
    }
    // Optionally trigger internal validation or events within the state object itself if needed later
  }

  setActivePlan(planId: string, planNodes: PlanNode[]): void {
    this.currentPlanId = planId;
    this.activePlanNodes = planNodes;
  }

  clearActivePlan(): void {
    this.currentPlanId = undefined;
    this.activePlanNodes = undefined;
  }

  updateWorkingMemory(content: any): void {
    this.workingMemoryContent = content;
  }

  /**
   * Add a perception to the buffer of unprocessed perceptions
   * @param perception The perception event to add to the buffer
   */
  addPerception(perception: AgentPerceptionEvent): void {
    this.perceptionBuffer.push(perception);
    this.lastActivityTimestamp = Date.now(); // Update timestamp on perception
  }

  /**
   * Get the next perception to process and remove it from the buffer
   * @returns The next perception event to process, or undefined if buffer is empty
   */
  getNextPerception(): AgentPerceptionEvent | undefined {
    return this.perceptionBuffer.shift();
  }

  /**
   * Peek at all unprocessed perceptions without removing them
   * @returns Array of all unprocessed perceptions
   */
  getAllPendingPerceptions(): AgentPerceptionEvent[] {
    return [...this.perceptionBuffer];
  }

  clearPerceptionBuffer(): void {
    this.perceptionBuffer = [];
  }
}

// Example usage (would be within AgentService or similar):
// const initialState = { mood: 'neutral', ... }; // Populate from config/defaults
// const runtimeState = new AgentRuntimeState('agent-123', agentConfig, initialState);
