import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  AddObservationParams,
  Concept,
  Fact,
  Observation,
  RetrieveConceptsParams,
  RetrieveFactsParams,
  RetrieveObservationsParams,
  SelfModel,
  UpsertFactParams,
} from '@pixeltales/contracts';
import { IMemoryInterface, MEMORY_INTERFACE } from '../memory/memory.interface';
import { IOntologyInterface, ONTOLOGY_SERVICE } from '../ontology/ontology.interface';
import {
  ISelfModelingInterface,
  SELF_MODELING_SERVICE,
} from '../self-modeling/self-modeling.interface';
import { IInternalToolsInterface } from './internal-tools.interface';
// TODO: Import ICuriosityInterface when available

/**
 * Provides a facade for the agent to access its internal cognitive functions
 * through a standardized tool-like interface.
 */
@Injectable()
export class InternalToolsService implements IInternalToolsInterface {
  private readonly logger = new Logger(InternalToolsService.name);

  constructor(
    @Inject(MEMORY_INTERFACE) private readonly memoryInterface: IMemoryInterface,
    @Inject(ONTOLOGY_SERVICE) private readonly ontologyService: IOntologyInterface,
    @Inject(SELF_MODELING_SERVICE) private readonly selfModelingService: ISelfModelingInterface,
    // @Inject(CURIOSITY_SERVICE) private readonly curiosityService: ICuriosityService,
  ) {}

  // --- Memory Tools --- //
  async 'memory.addObservation'(agentId: string, params: AddObservationParams): Promise<void> {
    this.logger.debug(`[${agentId}] Tool call: memory.addObservation`);
    await this.memoryInterface.addObservation(agentId, params);
  }
  async 'memory.retrieveObservations'(
    agentId: string,
    params: RetrieveObservationsParams,
  ): Promise<Observation[]> {
    this.logger.debug(`[${agentId}] Tool call: memory.retrieveObservations`);
    return this.memoryInterface.retrieveObservations(agentId, params);
  }
  async 'memory.upsertFact'(agentId: string, params: UpsertFactParams): Promise<void> {
    this.logger.debug(`[${agentId}] Tool call: memory.upsertFact`);
    await this.memoryInterface.upsertFact(agentId, params);
  }
  async 'memory.retrieveFacts'(agentId: string, params: RetrieveFactsParams): Promise<Fact[]> {
    this.logger.debug(`[${agentId}] Tool call: memory.retrieveFacts`);
    return this.memoryInterface.retrieveFacts(agentId, params);
  }

  // --- DateTime Tool --- //
  // TODO: Implement and uncomment in interface
  async 'datetime.getCurrentTime'(agentId: string): Promise<{ timestamp: number; iso: string }> {
    this.logger.debug(`[${agentId}] Tool call: datetime.getCurrentTime`);
    const now = new Date();
    return { timestamp: now.getTime(), iso: now.toISOString() };
  }

  // --- Ontology Tools (Delegate to OntologyService) --- //
  async 'ontology.getConcepts'(
    agentId: string,
    params: RetrieveConceptsParams,
  ): Promise<Concept[]> {
    this.logger.debug(`[${agentId}] Tool call: ontology.getConcepts`);
    return this.ontologyService.retrieveConcepts(agentId, params);
  }
  async 'ontology.checkRelation'(
    agentId: string,
    params: { sourceConceptId: string; relationType: string; targetConceptId: string },
  ): Promise<boolean> {
    this.logger.warn(
      `[${agentId}] Tool ontology.checkRelation not fully implemented (needs OntologyService method).`,
    );
    // TODO: Add checkRelation method to IOntologyService and call it
    // return this.ontologyService.checkRelation(agentId, params);
    return false;
  }

  // --- Self-Modeling Tools (Delegate to SelfModelingService) --- //
  async 'self.assessCapability'(
    agentId: string,
    params: { taskDescription: string },
  ): Promise<{ capability: string; confidence: number }> {
    this.logger.debug(`[${agentId}] Tool call: self.assessCapability`);
    // TODO: Add assessCapability method to ISelfModelingInterface & Service
    this.logger.warn('self.assessCapability not implemented in SelfModelingService yet.');
    return { capability: 'unknown', confidence: 0 }; // Placeholder
  }

  async 'self.getAgencyBoundaries'(agentId: string): Promise<string[]> {
    this.logger.debug(`[${agentId}] Tool call: self.getAgencyBoundaries`);
    // This method *is* on IMemoryInterface, not ISelfModelingInterface based on our refactor
    return this.memoryInterface.getAgencyBoundaries(agentId);
  }

  async 'self.getSelfConceptSummary'(agentId: string): Promise<Partial<SelfModel>> {
    this.logger.debug(`[${agentId}] Tool call: self.getSelfConceptSummary`);
    // Get full model via MemoryService and return summary
    // Note: getSelfConcept IS part of IMemoryInterface
    const fullModel = await this.memoryInterface.getSelfConcept(agentId);
    // Create summary - Adjust based on actual SelfModel structure
    return {
      capabilities: fullModel.capabilities,
      role: fullModel.role,
      selfAwareness: fullModel.selfAwareness,
    };
  }

  // --- Conversation Tools --- //
  // TODO: Implement conversation control logic (requires CognitiveCycleService or similar)
  async 'conversation.requestEnd'(agentId: string, params: { reason?: string }): Promise<void> {
    this.logger.debug(`[${agentId}] Tool call: conversation.requestEnd - Reason: ${params.reason}`);
    // TODO: Signal intent to CognitiveCycleService or AgentService
  }
  async 'conversation.assessEngagement'(agentId: string): Promise<number> {
    this.logger.warn(`[${agentId}] Tool conversation.assessEngagement not implemented.`);
    // TODO: Implement engagement assessment logic
    return 0.5; // Placeholder
  }

  // --- Curiosity Tools --- //
  // TODO: Implement when CuriosityService is available
  async 'curiosity.recordSurprise'(
    agentId: string,
    params: { observationContent: string; expectedVsActual: string },
  ): Promise<void> {
    this.logger.debug(`[${agentId}] Tool call: curiosity.recordSurprise`);
    // TODO: Delegate to CuriosityService
  }
  async 'curiosity.generateHypothesis'(
    agentId: string,
    params: { observationContent: string },
  ): Promise<{ hypothesisId: string; hypothesisContent: string }> {
    this.logger.debug(`[${agentId}] Tool call: curiosity.generateHypothesis`);
    // TODO: Delegate to CuriosityService
    return {
      hypothesisId: 'temp-hyp-id-' + Math.random(),
      hypothesisContent: 'placeholder hypothesis',
    }; // Placeholder
  }
}
