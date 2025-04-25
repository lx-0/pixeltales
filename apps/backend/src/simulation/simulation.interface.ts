import { AgentPerceptionEvent } from '@pixeltales/contracts';

/**
 * Interface for the Simulation Service (Placeholder).
 * Responsible for managing the shared environment state and generating perceptions.
 */
export interface ISimulationService {
  /**
   * Gets the next perception event for a specific agent.
   * In a real simulation, this would check the environment state relative to the agent.
   * @param agentId The ID of the agent.
   * @returns The next perception event or null if none currently available.
   */
  getNextPerception(agentId: string): Promise<AgentPerceptionEvent | null>;

  /**
   * Informs the simulation that an agent performed an action.
   * The simulation would then update its state and potentially generate
   * new perception events for other agents.
   * @param agentId The ID of the agent acting.
   * @param actionDetails Details of the action performed (e.g., from emitted event).
   */
  notifyAction(agentId: string, actionDetails: any): Promise<void>;
}

export const SIMULATION_SERVICE = Symbol('ISimulationService');
