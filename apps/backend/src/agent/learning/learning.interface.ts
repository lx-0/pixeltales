import { AgentAction, AgentState } from '@pixeltales/contracts';
/**
 * Defines the interface for the agent's learning system.
 * Based on section 2.7 and 4.6.2.
 */
export interface ILearningInterface {
  /**
   * Records a learning experience tuple (state, action, reward).
   * @param stateSnapshot A snapshot of the agent's state before the action.
   * @param agentAction The action taken by the agent.
   * @param rewardScore The scalar reward received for the action in that state.
   */
  recordReward(
    stateSnapshot: AgentState,
    agentAction: AgentAction,
    rewardScore: number,
  ): Promise<void>;

  /**
   * Retrieves a batch of past experiences for training or analysis.
   * @param batchSize The number of experiences to retrieve.
   * @param criteria Optional criteria for selecting experiences (e.g., time range, reward threshold).
   * @returns A promise resolving to an array of experience tuples.
   */
  getExperienceBatch(
    batchSize: number,
    criteria?: any,
  ): Promise<{ state: AgentState; action: AgentAction; reward: number }[]>;

  /**
   * Triggers an update of the agent's policy or internal models based on learned experiences.
   * This might be called periodically or based on specific triggers.
   * @param agentId The ID of the agent whose policy should be updated.
   */
  updatePolicy(agentId: string): Promise<void>;

  // Add other learning-related methods as needed, e.g., for meta-learning or model adaptation.
}

// Define injection token if using NestJS dependency injection
export const LEARNING_INTERFACE = Symbol('ILearningInterface');
