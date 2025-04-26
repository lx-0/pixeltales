import { Injectable, Logger } from '@nestjs/common';
import {
  AddObservationParams,
  Concept,
  Fact,
  Observation,
  PlanNode,
  PlanStatus,
  ReflectionReport,
  RetrieveConceptsParams,
  RetrieveFactsParams,
  RetrieveObservationsParams,
  SelfModel,
  UpsertConceptParams,
  UpsertFactParams,
} from '@pixeltales/contracts';
import { EpisodicMemoryService } from './episodic-memory.service';
import { IMemoryInterface } from './memory.interface';
import { SemanticMemoryService } from './semantic-memory.service';

@Injectable()
export class MemoryService implements IMemoryInterface {
  private readonly logger = new Logger(MemoryService.name);

  constructor(
    private readonly episodic: EpisodicMemoryService,
    private readonly semantic: SemanticMemoryService,
  ) {}

  // --- Delegate methods to the appropriate service --- //

  addObservation(agentId: string, params: AddObservationParams): Promise<void> {
    this.logger.debug(`[${agentId}] Facade: Delegating addObservation`);
    return this.episodic.addObservation(agentId, params);
  }

  retrieveObservations(
    agentId: string,
    params: RetrieveObservationsParams,
  ): Promise<Observation[]> {
    this.logger.debug(`[${agentId}] Facade: Delegating retrieveObservations`);
    return this.episodic.retrieveObservations(agentId, params);
  }

  upsertFact(agentId: string, params: UpsertFactParams): Promise<void> {
    this.logger.debug(`[${agentId}] Facade: Delegating upsertFact`);
    return this.semantic.upsertFact(agentId, params);
  }

  retrieveFacts(agentId: string, params: RetrieveFactsParams): Promise<Fact[]> {
    this.logger.debug(`[${agentId}] Facade: Delegating retrieveFacts`);
    return this.semantic.retrieveFacts(agentId, params);
  }

  upsertConcept(agentId: string, params: UpsertConceptParams): Promise<void> {
    this.logger.debug(`[${agentId}] Facade: Delegating upsertConcept`);
    return this.semantic.upsertConcept(agentId, params);
  }

  retrieveConcepts(agentId: string, params: RetrieveConceptsParams): Promise<Concept[]> {
    this.logger.debug(`[${agentId}] Facade: Delegating retrieveConcepts`);
    return this.semantic.retrieveConcepts(agentId, params);
  }

  updateOntology(agentId: string, conceptId: string, updates: any): Promise<void> {
    this.logger.debug(`[${agentId}] Facade: Delegating updateOntology`);
    return this.semantic.updateOntology(agentId, conceptId, updates);
  }

  getSelfConcept(agentId: string): Promise<SelfModel> {
    this.logger.debug(`[${agentId}] Facade: Delegating getSelfConcept`);
    return this.semantic.getSelfConcept(agentId);
  }

  updateSelfConcept(agentId: string, updates: Partial<SelfModel>): Promise<void> {
    this.logger.debug(`[${agentId}] Facade: Delegating updateSelfConcept`);
    return this.semantic.updateSelfConcept(agentId, updates);
  }

  queryCapabilities(
    agentId: string,
    taskDescription: string,
  ): Promise<{ capability: string; confidence: number }[]> {
    this.logger.debug(`[${agentId}] Facade: Delegating queryCapabilities`);
    return this.semantic.queryCapabilities(agentId, taskDescription);
  }

  getAgencyBoundaries(agentId: string): Promise<string[]> {
    this.logger.debug(`[${agentId}] Facade: Delegating getAgencyBoundaries`);
    return this.semantic.getAgencyBoundaries(agentId);
  }

  // --- Plan Persistence Methods --- //

  createPlan(agentId: string, goal: string): Promise<string> {
    this.logger.debug(`[${agentId}] Facade: Delegating createPlan`);
    return this.semantic.createPlan(agentId, goal);
  }

  addPlanNodes(
    planId: string,
    agentId: string,
    nodes: { description: string; parentId?: string }[],
  ): Promise<void> {
    this.logger.debug(`[${agentId}] Facade: Delegating addPlanNodes`);
    return this.semantic.addPlanNodes(planId, agentId, nodes);
  }

  createPlanWithNodes(agentId: string, goal: string, steps: string[]): Promise<string> {
    this.logger.debug(`[${agentId}] Facade: Delegating createPlanWithNodes`);
    return this.semantic.createPlanWithNodes(agentId, goal, steps);
  }

  getPlan(planId: string): Promise<{ id: string; agentId: string; goal: string; status: string }> {
    this.logger.debug(`Facade: Delegating getPlan for ${planId}`);
    return this.semantic.getPlan(planId);
  }

  getNextPlanNode(planId: string): Promise<PlanNode | null> {
    this.logger.debug(`Facade: Delegating getNextPlanNode for ${planId}`);
    return this.semantic.getNextPlanNode(planId);
  }

  updatePlanNodeStatus(
    planId: string,
    nodeId: string,
    status: PlanStatus,
    result?: any,
  ): Promise<void> {
    this.logger.debug(`Facade: Delegating updatePlanNodeStatus for node ${nodeId}`);
    return this.semantic.updatePlanNodeStatus(planId, nodeId, status, result);
  }

  markPlanFailed(planId: string): Promise<void> {
    this.logger.debug(`Facade: Delegating markPlanFailed for ${planId}`);
    return this.semantic.markPlanFailed(planId);
  }

  markPlanCompleted(planId: string): Promise<void> {
    this.logger.debug(`Facade: Delegating markPlanCompleted for ${planId}`);
    return this.semantic.markPlanCompleted(planId);
  }

  createReplan(originalPlanId: string, failureReason: string): Promise<string> {
    this.logger.debug(`Facade: Delegating createReplan for ${originalPlanId}`);
    return this.semantic.createReplan(originalPlanId, failureReason);
  }

  // --- Reflection Persistence --- //
  addReflectionReport(agentId: string, report: ReflectionReport): Promise<void> {
    this.logger.debug(`[${agentId}] Facade: Delegating addReflectionReport`);
    return this.semantic.addReflectionReport(agentId, report);
  }
}
