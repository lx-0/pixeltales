import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  Concept,
  ReflectionReport,
  RetrieveConceptsParams,
  UpsertConceptParams,
} from '@pixeltales/contracts';
import { IMemoryInterface, MEMORY_INTERFACE } from '../memory/memory.interface';
import { IOntologyInterface } from './ontology.interface';

@Injectable()
export class OntologyService implements IOntologyInterface {
  private readonly logger = new Logger(OntologyService.name);

  constructor(
    // Inject Memory Interface for data access
    @Inject(MEMORY_INTERFACE) private readonly memoryInterface: IMemoryInterface,
  ) {}

  /**
   * Adds or updates a concept by delegating persistence to MemoryService.
   */
  async upsertConcept(agentId: string, params: UpsertConceptParams): Promise<void> {
    this.logger.debug(`[${agentId}] OntologyService: Delegating upsertConcept to MemoryService`);
    // Delegate persistence to MemoryService via IMemoryInterface
    return this.memoryInterface.upsertConcept(agentId, params);
  }

  /**
   * Retrieves concepts by delegating persistence to MemoryService.
   */
  async retrieveConcepts(agentId: string, params: RetrieveConceptsParams): Promise<Concept[]> {
    this.logger.debug(`[${agentId}] OntologyService: Delegating retrieveConcepts to MemoryService`);
    // Delegate retrieval to MemoryService via IMemoryInterface
    return this.memoryInterface.retrieveConcepts(agentId, params);
  }

  /**
   * Updates relations or properties of an existing concept by delegating to MemoryService.
   * Higher-level logic for *determining* updates belongs here, but persistence is delegated.
   */
  async updateOntology(agentId: string, conceptId: string, updates: any): Promise<void> {
    this.logger.debug(
      `[${agentId}] OntologyService: Delegating updateOntology for concept ${conceptId} to MemoryService`,
    );
    return this.memoryInterface.updateOntology(agentId, conceptId, updates);
  }

  /**
   * Classifies an entity based on candidate categories.
   * This service handles the logic; persistence/retrieval is via MemoryService.
   */
  async categorize(
    agentId: string,
    entityDescription: string,
    candidateCategories: string[],
  ): Promise<{ category: string; confidence: number } | null> {
    this.logger.warn(`[${agentId}] OntologyService: categorize - Needs full Implementation`);
    // CORRECT: Logic would use memoryInterface.
    try {
      // 1. Retrieve potentially relevant categories concepts
      const relevantConcepts = await this.memoryInterface.retrieveConcepts(agentId, {
        query: candidateCategories.join(' | '), // Example: simple query based on names
        limit: 10,
      });
      this.logger.debug(
        `[${agentId}] Categorize: Found ${relevantConcepts.length} related concepts.`,
      );

      // 2. TODO: Use LLM or rules, providing fetched concepts and entityDescription.
      // const result = await llm.invoke(...);

      // 3. Return result (placeholder)
      return null;
    } catch (error) {
      this.logger.error(`[${agentId}] Error during categorization:`, error);
      return null;
    }
  }

  /**
   * Infers properties of an entity based on its category or relations.
   * This service handles the logic; persistence/retrieval is via MemoryService.
   */
  async inferProperties(
    agentId: string,
    entityId: string, // Can be concept ID or subject ID of facts
    propertiesToInfer: string[],
  ): Promise<Record<string, any>> {
    this.logger.warn(`[${agentId}] OntologyService: inferProperties - Needs Implementation`);
    // CORRECT: Logic would use memoryInterface.
    try {
      // 1. Fetch concept/facts for entityId
      const concepts = await this.memoryInterface.retrieveConcepts(agentId, {
        query: entityId,
        limit: 1,
      });
      const facts = await this.memoryInterface.retrieveFacts(agentId, {
        subjectVisualId: entityId,
        limit: 50,
      });
      this.logger.debug(
        `[${agentId}] InferProperties: Found ${concepts.length} concepts and ${facts.length} facts for ${entityId}.`,
      );

      // 2. TODO: Fetch related concepts/facts based on relations (stored as facts?).
      // 3. TODO: Apply reasoning rules or graph traversal.
      const inferredProps: Record<string, any> = {};
      // Example placeholder: copy direct facts matching requested properties
      for (const fact of facts) {
        if (propertiesToInfer.includes(fact.key)) {
          inferredProps[fact.key] = fact.value;
        }
      }
      return inferredProps; // Return inferred properties (placeholder logic)
    } catch (error) {
      this.logger.error(`[${agentId}] Error during property inference:`, error);
      return {};
    }
  }

  /**
   * Applies insights gained from reflection specifically to update the ontology.
   */
  async applyReflectionInsights(
    agentId: string,
    ontologyInsights: ReflectionReport['insights'],
  ): Promise<void> {
    this.logger.debug(
      `[${agentId}] OntologyService: Applying ${ontologyInsights.length} ontology-related reflection insights.`,
    );

    // TODO: Replace simple heuristics below with more robust insight interpretation logic.
    // This should ideally involve LLM calls to understand the semantics and map to
    // structured ontology updates (concepts AND relations). Currently uses basic regex
    // and only attempts concept creation or storing relations as simple facts.

    if (ontologyInsights.length === 0) {
      this.logger.verbose(`[${agentId}] No ontology insights to apply.`);
      return;
    }

    let updatesAppliedCount = 0;
    for (const insight of ontologyInsights) {
      // Focus only on insights tagged as 'world' or potentially 'social' for ontology
      if ((insight.type === 'world' || insight.type === 'social') && insight.confidence > 0.5) {
        // Try to extract a potential concept name
        const conceptMatch = insight.content.match(/concept of '([^']+)'/i);
        // Try to extract an is-a relationship
        const isAMatch = insight.content.match(/'([^']+)' is a type of '([^']+)'/i);
        // Try to extract a has-property relationship
        const hasPropMatch = insight.content.match(
          /'([^']+)' has property '([^']+)' with value '([^']+)'/i,
        );

        let appliedUpdate = false;

        if (conceptMatch && conceptMatch[1]) {
          const conceptName = conceptMatch[1];
          const conceptParams: UpsertConceptParams = {
            name: conceptName,
            description: insight.content,
            confidence: insight.confidence,
            category: 'inferred_from_reflection',
            properties: { derivedFromReflection: true },
          };
          this.logger.log(
            `[${agentId}] Attempting to upsert concept '${conceptName}' from insight...`,
          );
          try {
            await this.upsertConcept(agentId, conceptParams);
            appliedUpdate = true;
          } catch (error) {
            this.logger.error(
              `[${agentId}] Failed to upsert concept '${conceptName}' from reflection insight`,
              error,
            );
          }
        } else if (isAMatch && isAMatch[1] && isAMatch[2]) {
          // Placeholder: Add relation as a fact if relation schema/methods aren't available
          const subjectConcept = isAMatch[1];
          const objectConcept = isAMatch[2];
          this.logger.log(`[${agentId}] Attempting to add 'is_a' relation as fact...`);
          try {
            await this.memoryInterface.upsertFact(agentId, {
              subjectVisualId: subjectConcept, // Using name as ID here, might need better resolution
              key: 'is_a',
              value: objectConcept,
              confidence: insight.confidence,
            });
            appliedUpdate = true;
          } catch (error) {
            this.logger.error(`[${agentId}] Failed to add relation as fact`, error);
          }
        } else if (hasPropMatch && hasPropMatch[1] && hasPropMatch[2] && hasPropMatch[3]) {
          // Add property as a fact
          const subjectConcept = hasPropMatch[1];
          const propertyKey = hasPropMatch[2];
          const propertyValue = hasPropMatch[3];
          this.logger.log(`[${agentId}] Attempting to add property '${propertyKey}' as fact...`);
          try {
            await this.memoryInterface.upsertFact(agentId, {
              subjectVisualId: subjectConcept,
              key: propertyKey,
              value: propertyValue,
              confidence: insight.confidence,
            });
            appliedUpdate = true;
          } catch (error) {
            this.logger.error(`[${agentId}] Failed to add property as fact`, error);
          }
        }

        if (appliedUpdate) {
          updatesAppliedCount++;
        }
      }
    }

    if (updatesAppliedCount === 0) {
      this.logger.log(`[${agentId}] No actionable ontology updates derived from insights.`);
    } else {
      this.logger.log(
        `[${agentId}] Applied ${updatesAppliedCount} ontology updates from insights.`,
      );
    }
  }
}
