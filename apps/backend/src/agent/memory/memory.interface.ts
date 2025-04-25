import {
  AddObservationParams,
  Concept,
  Fact,
  Observation,
  PlanNode,
  PlanStatus,
  RetrieveConceptsParams,
  RetrieveFactsParams,
  RetrieveObservationsParams,
  SelfModel,
  UpsertConceptParams,
  UpsertFactParams,
} from '@pixeltales/contracts';

/**
 * Defines the interface for interacting with ALL agent memory systems.
 * (Backend specific interface)
 */
export interface IMemoryInterface {
  // --- Episodic Memory ---
  addObservation(agentId: string, params: AddObservationParams): Promise<void>;
  retrieveObservations(agentId: string, params: RetrieveObservationsParams): Promise<Observation[]>;

  // --- Semantic Memory (Facts) ---
  upsertFact(agentId: string, params: UpsertFactParams): Promise<void>;
  retrieveFacts(agentId: string, params: RetrieveFactsParams): Promise<Fact[]>;

  // --- Semantic Memory (Concepts/Ontology) ---
  upsertConcept(agentId: string, params: UpsertConceptParams): Promise<void>;
  retrieveConcepts(agentId: string, params: RetrieveConceptsParams): Promise<Concept[]>;
  updateOntology(agentId: string, conceptId: string, updates: any): Promise<void>;

  // --- Self Model ---
  getSelfConcept(agentId: string): Promise<SelfModel>;
  updateSelfConcept(agentId: string, updates: Partial<SelfModel>): Promise<void>;
  queryCapabilities(
    agentId: string,
    taskDescription: string,
  ): Promise<{ capability: string; confidence: number }[]>;
  getAgencyBoundaries(agentId: string): Promise<string[]>;

  // --- Plan Persistence ---
  createPlan(agentId: string, goal: string): Promise<string>; // Returns planId
  addPlanNodes(
    planId: string,
    agentId: string,
    nodes: { description: string; parentId?: string }[],
  ): Promise<void>;
  createPlanWithNodes(agentId: string, goal: string, steps: string[]): Promise<string>; // Combined operation
  getPlan(planId: string): Promise<{ id: string; agentId: string; goal: string; status: string }>;
  getNextPlanNode(planId: string): Promise<PlanNode | null>;
  updatePlanNodeStatus(
    planId: string,
    nodeId: string,
    status: PlanStatus,
    result?: any,
  ): Promise<void>;
  markPlanFailed(planId: string): Promise<void>;
  markPlanCompleted(planId: string): Promise<void>;
  createReplan(originalPlanId: string, failureReason: string): Promise<string>; // Returns new planId
}

export const MEMORY_INTERFACE = Symbol('IMemoryInterface');
