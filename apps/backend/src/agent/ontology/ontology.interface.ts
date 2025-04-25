import { Concept, RetrieveConceptsParams, UpsertConceptParams } from '@pixeltales/contracts';

/**
 * Interface for the Ontology Service, handling structured knowledge
 * representation (concepts, relations) and reasoning.
 */
export interface IOntologyInterface {
  /**
   * Adds or updates a concept in the agent's knowledge base.
   */
  upsertConcept(agentId: string, params: UpsertConceptParams): Promise<void>;

  /**
   * Retrieves concepts from the agent's knowledge base based on criteria.
   */
  retrieveConcepts(agentId: string, params: RetrieveConceptsParams): Promise<Concept[]>;

  /**
   * Updates the structure or relationships within the agent's ontology.
   * (e.g., adds or removes a relation between concepts)
   */
  updateOntology(agentId: string, conceptId: string, updates: any): Promise<void>; // TODO: Define update structure

  /**
   * Classifies an entity based on candidate categories.
   */
  categorize(
    agentId: string,
    entityDescription: string,
    candidateCategories: string[],
  ): Promise<{ category: string; confidence: number } | null>;

  /**
   * Infers properties of an entity based on its category or relations.
   */
  inferProperties(
    agentId: string,
    entityId: string,
    propertiesToInfer: string[],
  ): Promise<Record<string, any>>;

  // TODO: Add methods for relation management (addRelation, removeRelation, retrieveRelations) if needed
}

export const ONTOLOGY_SERVICE = Symbol('IOntologyInterface');
