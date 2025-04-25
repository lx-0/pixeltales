import { AgentAction } from '@pixeltales/contracts';

/**
 * Interface for the Action Service, responsible for dispatching
 * agent actions to the appropriate capability extensions.
 */
export interface IActionService {
  /**
   * Receives an action decided by the Cognitive Cycle and routes it
   * to the corresponding Capability Extension for execution.
   *
   * @param agentId The ID of the agent performing the action.
   * @param action The AgentAction object representing the desired action.
   */
  dispatchAction(agentId: string, action: AgentAction): Promise<void>;
}

export const ACTION_SERVICE = Symbol('IActionService');
