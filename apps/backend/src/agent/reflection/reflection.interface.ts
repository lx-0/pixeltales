import { ReflectionReport } from '@pixeltales/contracts';

/**
 * Defines the interface for the Reflection Service.
 * Responsible for orchestrating the synthesis of insights from experience.
 */
export interface IReflectionService {
  /**
   * Initiates a reflection cycle for the given agent.
   * This involves retrieving recent experiences, analyzing them (potentially via LLM),
   * generating insights, triggering updates in other subsystems (Self-Model, Ontology),
   * and producing a ReflectionReport.
   *
   * @param agentId The ID of the agent performing the reflection.
   * @param trigger The reason for initiating reflection (e.g., 'idle', 'periodic').
   * @returns A promise resolving to the generated ReflectionReport.
   */
  performReflection(agentId: string, trigger: string): Promise<ReflectionReport>;
}

export const REFLECTION_SERVICE = Symbol('IReflectionService');
