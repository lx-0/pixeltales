import {
  AddObservationParams,
  Fact,
  Observation,
  RetrieveFactsParams,
  RetrieveObservationsParams,
  UpsertFactParams,
} from '@pixeltales/contracts';

/**
 * Interface defining the tools available to the agent for accessing
 * its internal cognitive functions (memory, ontology, self-model, etc.).
 *
 * Method names use 'namespace.action' format for clarity when used
 * via LLM function/tool calling.
 */
export interface IInternalToolsInterface {
  // --- Memory Tools --- //
  'memory.addObservation'(agentId: string, params: AddObservationParams): Promise<void>;
  'memory.retrieveObservations'(
    agentId: string,
    params: RetrieveObservationsParams,
  ): Promise<Observation[]>;
  'memory.upsertFact'(agentId: string, params: UpsertFactParams): Promise<void>;
  'memory.retrieveFacts'(agentId: string, params: RetrieveFactsParams): Promise<Fact[]>;

  // --- DateTime Tool --- //
  // TODO: Implement and uncomment
  // 'datetime.getCurrentTime'(agentId: string): Promise<{ timestamp: number; iso: string }>;

  // --- Ontology Tools --- //
  // TODO: Implement and uncomment (OntologyService?)
  // 'ontology.getConcepts'(agentId: string, params: RetrieveConceptsParams): Promise<Concept[]>;
  // 'ontology.checkRelation'(agentId: string, params: { sourceConceptId: string; relationType: string; targetConceptId: string; }): Promise<boolean>;

  // --- Self-Modeling Tools --- //
  // TODO: Implement and uncomment (SelfModelingService?)
  // 'self.assessCapability'(agentId: string, params: { taskDescription: string; }): Promise<{ capability: string; confidence: number }>;
  // 'self.getAgencyBoundaries'(agentId: string): Promise<string[]>;
  // 'self.getSelfConceptSummary'(agentId: string): Promise<Partial<SelfModel>>;

  // --- Conversation Tools --- //
  // TODO: Implement and uncomment (CognitiveCycleService?)
  // 'conversation.requestEnd'(agentId: string, params: { reason?: string }): Promise<void>;
  // 'conversation.assessEngagement'(agentId: string): Promise<number>;

  // --- Curiosity Tools --- //
  // TODO: Implement and uncomment (CuriosityService?)
  // 'curiosity.recordSurprise'(agentId: string, params: { observationContent: string; expectedVsActual: string; }): Promise<void>;
  // 'curiosity.generateHypothesis'(agentId: string, params: { observationContent: string; }): Promise<{ hypothesisId: string; hypothesisContent: string }>;
}

export const INTERNAL_TOOLS_INTERFACE = Symbol('IInternalToolsInterface');
