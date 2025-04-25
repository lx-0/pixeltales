import { AgentAction } from '@pixeltales/contracts';

/**
 * Defines the result structure for executing a capability.
 */
export type CapabilityExecutionResult = {
  success: boolean;
  message?: string;
  details?: Record<string, any>;
};

/**
 * Interface for Capability Extensions.
 * (Backend specific interface)
 */
export interface ICapabilityExtension {
  readonly capabilityName: string;

  /**
   * Executes an action in the environment simulation layer.
   * @param agentId The ID of the agent performing the action.
   * @param action The specific action payload from AgentActionSchema.
   * @returns A promise resolving to the result of the action.
   */
  execute(agentId: string, payload: AgentAction['payload']): Promise<CapabilityExecutionResult>;
}

export const CAPABILITY_EXTENSION = Symbol('ICapabilityExtension');
