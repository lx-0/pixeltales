import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  Concept,
  Fact,
  PlanNode,
  PlanStatus,
  ReflectionReport,
  RetrieveConceptsParams,
  RetrieveFactsParams,
  SelfModel,
  UpsertConceptParams,
  UpsertFactParams,
  uuid,
} from '@pixeltales/contracts';
import * as schema from '@pixeltales/database';
import { and, eq, gte, inArray, like, sql } from 'drizzle-orm';
import { DRIZZLE_INSTANCE, DatabaseSchema } from '../../db/drizzle.provider';
import { IMemoryInterface } from './memory.interface';

@Injectable()
// This service implements the non-episodic parts of IMemoryInterface
export class SemanticMemoryService
  implements Omit<IMemoryInterface, 'addObservation' | 'retrieveObservations'>
{
  private readonly logger = new Logger(SemanticMemoryService.name);

  constructor(@Inject(DRIZZLE_INSTANCE) private db: DatabaseSchema) {}

  // --- Fact Methods --- //
  async upsertFact(agentId: string, params: UpsertFactParams): Promise<void> {
    this.logger.debug(
      `Upserting fact for agent ${agentId}: [${params.subjectVisualId} / ${params.key}]`,
    );
    try {
      await this.db
        .insert(schema.semanticFacts)
        .values({
          agentId: agentId,
          subjectVisualId: params.subjectVisualId,
          key: params.key,
          value: params.value,
          confidence: params.confidence,
          lastUpdated: new Date(),
        })
        .onConflictDoUpdate({
          target: [
            schema.semanticFacts.agentId,
            schema.semanticFacts.subjectVisualId,
            schema.semanticFacts.key,
          ],
          set: {
            value: params.value,
            confidence: params.confidence,
            lastUpdated: new Date(),
          },
        });
      this.logger.verbose(`Upserted fact for agent ${agentId}`);
    } catch (error) {
      this.logger.error(
        `Failed to upsert fact for agent ${agentId}`,
        error instanceof Error ? error.stack : error,
      );
      throw error;
    }
  }

  async retrieveFacts(agentId: string, params: RetrieveFactsParams): Promise<Fact[]> {
    this.logger.debug(`Retrieving facts for agent ${agentId}`);
    const limit = params.limit ?? 50;
    const conditions = [eq(schema.semanticFacts.agentId, agentId)];
    if (params.subjectVisualId) {
      conditions.push(eq(schema.semanticFacts.subjectVisualId, params.subjectVisualId));
    }
    if (params.keyFilter?.length) {
      conditions.push(inArray(schema.semanticFacts.key, params.keyFilter));
    }
    if (params.minConfidence) {
      conditions.push(gte(schema.semanticFacts.confidence, params.minConfidence));
    }
    try {
      const results = await this.db
        .select()
        .from(schema.semanticFacts)
        .where(and(...conditions))
        .orderBy(sql`${schema.semanticFacts.lastUpdated} DESC`)
        .limit(limit);
      this.logger.verbose(`Retrieved ${results.length} facts for agent ${agentId}`);
      const contractFacts: Fact[] = results.map((dbFact) => ({
        ...dbFact,
        lastUpdated: dbFact.lastUpdated.getTime(),
        provenance: dbFact.provenance ?? undefined,
        subjectVisualId: dbFact.subjectVisualId ?? undefined,
      }));
      return contractFacts;
    } catch (error) {
      this.logger.error(`Failed to retrieve facts for agent ${agentId}`, error);
      return [];
    }
  }

  // --- Concept/Ontology Methods --- //
  async upsertConcept(agentId: string, params: UpsertConceptParams): Promise<void> {
    this.logger.debug(`Upserting concept for agent ${agentId}: ${params.name}`);
    try {
      await this.db
        .insert(schema.semanticConcepts)
        .values({
          agentId: agentId,
          name: params.name,
          description: params.description,
          category: params.category,
          properties: params.properties,
          confidence: params.confidence,
          lastUpdated: new Date(),
        })
        .onConflictDoUpdate({
          target: [schema.semanticConcepts.agentId, schema.semanticConcepts.name],
          set: {
            description: params.description,
            category: params.category,
            properties: params.properties,
            confidence: params.confidence,
            lastUpdated: new Date(),
          },
        });
      this.logger.verbose(`Upserted concept for agent ${agentId}: ${params.name}`);
    } catch (error) {
      this.logger.error(`Failed to upsert concept ${params.name} for agent ${agentId}`, error);
      throw error;
    }
  }

  async retrieveConcepts(agentId: string, params: RetrieveConceptsParams): Promise<Concept[]> {
    this.logger.debug(`Retrieving concepts for agent ${agentId}`);
    const limit = params.limit ?? 50;
    const conditions = [eq(schema.semanticConcepts.agentId, agentId)];
    if (params.category) {
      conditions.push(eq(schema.semanticConcepts.category, params.category));
    }
    if (params.query) {
      conditions.push(like(schema.semanticConcepts.name, `%${params.query}%`));
    }
    if (params.isInstance !== undefined) {
      this.logger.warn('Filtering by isInstance not implemented');
    }
    if (params.minConfidence) {
      conditions.push(gte(schema.semanticConcepts.confidence, params.minConfidence));
    }
    try {
      const results = await this.db
        .select()
        .from(schema.semanticConcepts)
        .where(and(...conditions))
        .orderBy(sql`${schema.semanticConcepts.lastUpdated} DESC`)
        .limit(limit);
      this.logger.verbose(`Retrieved ${results.length} concepts for agent ${agentId}`);
      const contractConcepts: Concept[] = results.map((dbConcept) => ({
        ...dbConcept,
        createdAt: dbConcept.createdAt?.getTime(),
        lastUpdated: dbConcept.lastUpdated?.getTime(),
        isInstance: false,
        provenance: undefined,
        description: dbConcept.description ?? undefined,
        category: dbConcept.category ?? undefined,
        properties: dbConcept.properties ?? undefined,
      }));
      return contractConcepts;
    } catch (error) {
      this.logger.error(`Failed to retrieve concepts for agent ${agentId}`, error);
      return [];
    }
  }

  async updateOntology(agentId: string, conceptId: string, updates: any): Promise<void> {
    this.logger.warn(
      `[${agentId}] updateOntology method is not fully implemented IN SemanticMemoryService.`,
    );
    throw new Error('Method not implemented.');
  }

  // --- Self Model Methods (Persistence handled here) --- //
  async getSelfConcept(agentId: string): Promise<SelfModel> {
    this.logger.debug(`[${agentId}] SemanticMemory: getSelfConcept (Persistence)`);
    try {
      const result = await this.db.query.agentSelfModels.findFirst({
        where: eq(schema.agentSelfModels.agentId, agentId),
      });

      const defaultSelfAwareness: SelfModel['selfAwareness'] = {
        nature: 'unknown',
        systemUnderstanding: 0.1,
        purpose: undefined,
      };
      const defaultRole: SelfModel['role'] = { primaryRole: 'default' };

      if (!result) {
        this.logger.warn(`No self-model found for agent ${agentId}, returning default.`);
        return {
          capabilities: {},
          agencyBoundaries: {},
          role: defaultRole,
          selfAwareness: defaultSelfAwareness,
          lastUpdated: Date.now(),
        };
      }

      // Type the potentially partial DB result
      const dbCognitiveStyle = result.cognitiveStyle as Partial<SelfModel['selfAwareness']> | null;
      const contractSelfAwareness: SelfModel['selfAwareness'] = {
        nature: dbCognitiveStyle?.nature ?? defaultSelfAwareness.nature,
        systemUnderstanding:
          dbCognitiveStyle?.systemUnderstanding ?? defaultSelfAwareness.systemUnderstanding,
        purpose: dbCognitiveStyle?.purpose ?? defaultSelfAwareness.purpose,
      };

      const selfModel: SelfModel = {
        capabilities: result.capabilities ?? {},
        agencyBoundaries: result.boundaries ?? {},
        role: result.roleConcept ? { primaryRole: result.roleConcept } : defaultRole,
        selfAwareness: contractSelfAwareness,
        lastUpdated: result.lastUpdated.getTime(),
      };
      return selfModel;
    } catch (error) {
      this.logger.error(`Failed to retrieve self-model for agent ${agentId}`, error);
      throw error;
    }
  }

  async updateSelfConcept(agentId: string, updates: Partial<SelfModel>): Promise<void> {
    this.logger.debug(`[${agentId}] SemanticMemory: updateSelfConcept (Persistence)`);
    try {
      // Manually build the payload for the DB update, only including non-undefined fields
      const updatePayload: {
        capabilities?: SelfModel['capabilities'];
        boundaries?: SelfModel['agencyBoundaries'];
        roleConcept?: string;
        cognitiveStyle?: SelfModel['selfAwareness'];
        lastUpdated: Date;
      } = { lastUpdated: new Date() }; // Always update lastUpdated

      if (updates.capabilities !== undefined) {
        updatePayload.capabilities = updates.capabilities;
      }
      if (updates.agencyBoundaries !== undefined) {
        updatePayload.boundaries = updates.agencyBoundaries;
      }
      if (updates.role?.primaryRole !== undefined) {
        updatePayload.roleConcept = updates.role.primaryRole;
      }
      if (updates.selfAwareness !== undefined) {
        updatePayload.cognitiveStyle = updates.selfAwareness;
      }
      // Note: personaSummary is not part of SelfModel contract currently

      // Use the explicitly built and typed payload
      await this.db
        .insert(schema.agentSelfModels)
        .values({ agentId, ...updatePayload }) // INSERT needs agentId + potentially all fields with defaults
        .onConflictDoUpdate({ target: schema.agentSelfModels.agentId, set: updatePayload }); // SET uses only provided fields

      this.logger.verbose(`Updated self-model for agent ${agentId}`);
    } catch (error) {
      this.logger.error(`Failed to update self-model for agent ${agentId}`, error);
      throw error;
    }
  }

  // --- Stubs for higher-level Self-Model methods --- //
  async queryCapabilities(
    agentId: string,
    taskDescription: string,
  ): Promise<{ capability: string; confidence: number }[]> {
    this.logger.error(
      `queryCapabilities called on SemanticMemoryService - Logic belongs in SelfModelingService.`,
    );
    throw new Error('Method not implemented by SemanticMemoryService.');
  }
  async getAgencyBoundaries(agentId: string): Promise<string[]> {
    this.logger.error(
      `getAgencyBoundaries called on SemanticMemoryService - Logic belongs in SelfModelingService.`,
    );
    throw new Error('Method not implemented by SemanticMemoryService.');
  }

  // --- Plan Persistence Implementation ---

  async createPlan(agentId: string, goal: string, planId?: string): Promise<string> {
    this.logger.debug(`[${agentId}] Creating plan record ${planId} for goal: ${goal}`);

    try {
      const newPlanId = planId ?? uuid();
      await this.db.insert(schema.plans).values({
        id: newPlanId,
        agentId,
        rootGoal: goal,
        status: 'in_progress',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return newPlanId;
    } catch (error) {
      this.logger.error(`[${agentId}] Error creating plan`, error);
      throw new Error(
        `Failed to create plan: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async addPlanNodes(planId: string, agentId: string, nodes: PlanNode[]): Promise<void> {
    this.logger.debug(`[${agentId}] Adding ${nodes.length} nodes to plan ${planId}`);

    try {
      const valuesToInsert = nodes.map((node) => ({
        id: node.id,
        planId,
        agentId,
        parentId: node.parentId || null,
        description: node.description,
        status: node.status,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      if (valuesToInsert.length > 0) {
        await this.db.insert(schema.planNodes).values(valuesToInsert);
      } else {
        this.logger.warn(
          `[${agentId}] addPlanNodes called with empty nodes array for plan ${planId}`,
        );
      }
    } catch (error) {
      this.logger.error(`[${agentId}] Error adding plan nodes`, error);
      throw new Error(
        `Failed to add plan nodes: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async getPlan(
    planId: string,
  ): Promise<{ id: string; agentId: string; goal: string; status: string }> {
    this.logger.debug(`Getting plan ${planId}`);

    try {
      const plan = await this.db.query.plans.findFirst({
        where: eq(schema.plans.id, planId),
      });

      if (!plan) {
        throw new Error(`Plan not found: ${planId}`);
      }

      return {
        id: plan.id,
        agentId: plan.agentId,
        goal: plan.rootGoal,
        status: plan.status,
      };
    } catch (error) {
      this.logger.error(`Error retrieving plan ${planId}`, error);
      throw new Error(
        `Failed to retrieve plan: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async getNextPlanNode(planId: string): Promise<PlanNode | null> {
    this.logger.debug(`Getting next plan node for plan ${planId}`);

    try {
      // First check if the plan is active
      const plan = await this.db.query.plans.findFirst({
        where: eq(schema.plans.id, planId),
      });

      if (!plan || plan.status !== 'in_progress') {
        this.logger.warn(`Plan ${planId} not active (status: ${plan?.status})`);
        return null;
      }

      // Find pending nodes
      const pendingNodes = await this.db.query.planNodes.findMany({
        where: and(eq(schema.planNodes.planId, planId), eq(schema.planNodes.status, 'pending')),
      });

      if (!pendingNodes || pendingNodes.length === 0 || !pendingNodes[0]) {
        this.logger.debug(`No pending nodes for plan ${planId}`);
        await this.markPlanCompleted(planId);
        return null;
      }

      // Get the next node and mark it as in_progress
      const nextNode = pendingNodes[0];
      await this.db
        .update(schema.planNodes)
        .set({ status: 'in_progress', updatedAt: new Date() })
        .where(eq(schema.planNodes.id, nextNode.id));

      // Convert to PlanNode type expected by interface
      const result: PlanNode = {
        id: nextNode.id,
        description: nextNode.description,
        status: nextNode.status,
        taskType: 'primitive', // Default assumption for now
        parentId: nextNode.parentId || undefined,
      };

      return result;
    } catch (error) {
      this.logger.error(`Error getting next plan node for ${planId}`, error);
      return null;
    }
  }

  async updatePlanNodeStatus(
    planId: string,
    nodeId: string,
    status: PlanStatus,
    result?: any,
  ): Promise<void> {
    this.logger.debug(`Updating node ${nodeId} in plan ${planId} to status ${status}`);

    try {
      await this.db
        .update(schema.planNodes)
        .set({
          status,
          result: result ? result : null,
          updatedAt: new Date(),
        })
        .where(and(eq(schema.planNodes.id, nodeId), eq(schema.planNodes.planId, planId)));

      // Check if we need to update the plan status
      if (status === 'completed') {
        // Check if all nodes are completed
        const pendingNodes = await this.db.query.planNodes.findMany({
          where: and(
            eq(schema.planNodes.planId, planId),
            inArray(schema.planNodes.status, ['pending', 'in_progress']),
          ),
        });

        if (pendingNodes.length === 0) {
          await this.markPlanCompleted(planId);
        }
      } else if (status === 'failed') {
        await this.markPlanFailed(planId);
      }
    } catch (error) {
      this.logger.error(`Error updating node ${nodeId} status`, error);
      throw new Error(
        `Failed to update node status: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async markPlanFailed(planId: string): Promise<void> {
    this.logger.debug(`Marking plan ${planId} as failed`);

    try {
      await this.db
        .update(schema.plans)
        .set({
          status: 'failed',
          updatedAt: new Date(),
        })
        .where(eq(schema.plans.id, planId));
    } catch (error) {
      this.logger.error(`Error marking plan ${planId} as failed`, error);
      throw new Error(
        `Failed to mark plan as failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async markPlanCompleted(planId: string): Promise<void> {
    this.logger.debug(`Marking plan ${planId} as completed`);

    try {
      await this.db
        .update(schema.plans)
        .set({
          status: 'completed',
          updatedAt: new Date(),
        })
        .where(eq(schema.plans.id, planId));
    } catch (error) {
      this.logger.error(`Error marking plan ${planId} as completed`, error);
      throw new Error(
        `Failed to mark plan as completed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async createReplan(originalPlanId: string, failureReason: string): Promise<string> {
    this.logger.debug(`Creating replan for failed plan ${originalPlanId}`);

    try {
      // Retrieve the original plan
      const originalPlan = await this.db.query.plans.findFirst({
        where: eq(schema.plans.id, originalPlanId),
      });

      if (!originalPlan) {
        throw new Error(`Original plan not found: ${originalPlanId}`);
      }

      // Create a new plan with updated goal
      const newPlanId = uuid();
      const modifiedGoal = `${originalPlan.rootGoal} (replanned after failure: ${failureReason})`;

      await this.db.insert(schema.plans).values({
        id: newPlanId,
        agentId: originalPlan.agentId,
        rootGoal: modifiedGoal,
        status: 'in_progress',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return newPlanId;
    } catch (error) {
      this.logger.error(`Error creating replan for ${originalPlanId}`, error);
      throw new Error(
        `Failed to create replan: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // --- Reflection Persistence --- //
  /**
   * Persists a generated reflection report.
   */
  async addReflectionReport(agentId: string, report: ReflectionReport): Promise<void> {
    this.logger.debug(`[${agentId}] Persisting reflection report ${report.reportId}`);
    try {
      await this.db.insert(schema.reflectionReports).values({
        id: report.reportId,
        agentId: agentId,
        trigger: report.trigger,
        timestamp: new Date(report.timestamp),
        processedObservationIds: report.processedObservationIds,
        insights: report.insights, // Stored as JSON
        potentialSelfModelUpdates: report.potentialSelfModelUpdates,
        potentialOntologyUpdates: report.potentialOntologyUpdates,
        newGoalsSuggested: report.newGoalsSuggested,
      });
      this.logger.verbose(`[${agentId}] Persisted reflection report ${report.reportId}`);
    } catch (error) {
      this.logger.error(
        `[${agentId}] Failed to persist reflection report ${report.reportId}`,
        error instanceof Error ? error.stack : error,
      );
      // Decide if this should throw or just log
      throw error;
    }
  }
}
