import { SelfModel } from '@pixeltales/contracts';

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
}

export const SELF_MODELING_SERVICE = Symbol('ISelfModelingInterface');
