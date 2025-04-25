import { AgentAction, AgentState, RewardFunctionInput } from '@pixeltales/contracts';

/**
 * Represents the inputs available for calculating a reward signal.
 */
export type RewardCalculationContext = {
  previousState: AgentState['dynamicState']; // State *before* the action
  actionTaken: AgentAction;
  resultingState: AgentState['dynamicState']; // State *after* the action (or perceived outcome)
  // Add other relevant context factors, e.g.:
  // - orientationContext?: OrientationContext;
  // - goalAchieved?: boolean;
  // - externalFeedback?: number; // e.g., user rating
  // - conversationRating?: number;
};

/**
 * Interface for components responsible for calculating reward signals
 * based on agent actions and their outcomes.
 */
export interface IRewardFunction {
  /**
   * Computes the reward for a given state transition and action.
   * @param input - Object containing state before/after, action taken, and contextual info.
   * @returns A scalar reward value.
   */
  compute(input: RewardFunctionInput): number;
}

// Define and export the injection token
export const REWARD_FUNCTION = Symbol('IRewardFunction');
