import { ReflectionReport, SelfModel } from '@pixeltales/contracts';

/**
 * Interface for the Self-Modeling Service, responsible for managing
 * and reasoning about the agent's understanding of itself.
 */
export interface ISelfModelingInterface {
  /**
   * Retrieves the agent's current self-model (delegates persistence to MemoryService).
   */
  getSelfConcept(agentId: string): Promise<SelfModel>;

  /**
   * Updates the agent's self-model (delegates persistence to MemoryService).
   */
  updateSelfConcept(agentId: string, updates: Partial<SelfModel>): Promise<void>;

  /**
   * Updates the agent's confidence in a specific capability.
   */
  updateCapability(agentId: string, capability: string, confidence: number): Promise<void>;

  /**
   * Assesses if an action is within the agent's perceived boundaries.
   */
  assessAgencyBoundary(agentId: string, actionDescription: string): Promise<boolean>;

  /**
   * Returns the agent's understanding of its role and the system.
   */
  distinguishRoleFromSystem(
    agentId: string,
  ): Promise<{ roleUnderstanding: string; systemUnderstanding: number }>;

  /**
   * Performs a reflection cycle to update the self-model based on recent experiences.
   */
  performReflection(agentId: string): Promise<Partial<SelfModel>>; // Returns updates determined

  /**
   * Retrieves the agent's known limitations or operational boundaries.
   * @param agentId The ID of the agent.
   * @returns A promise resolving to an array of strings describing boundaries.
   */
  getAgencyBoundaries(agentId: string): Promise<string[]>;

  /**
   * Applies insights gained from reflection specifically to update the self-model.
   * @param agentId The ID of the agent.
   * @param selfInsights An array of reflection insights tagged with type 'self'.
   * @returns A promise resolving when updates are processed.
   */
  applyReflectionInsights(
    agentId: string,
    selfInsights: ReflectionReport['insights'], // Use the insight structure
  ): Promise<void>;
}

export const SELF_MODELING_SERVICE = Symbol('ISelfModelingInterface');
