import { Inject, Injectable, Logger } from '@nestjs/common';
import { Observation, ReflectionReport, SelfModel } from '@pixeltales/contracts';
import { EVENT_BUS, IEventBus } from '../../core/event-bus.interface';
import { EventBusService } from '../../core/event-bus.service';
import { IMemoryInterface, MEMORY_INTERFACE } from '../memory/memory.interface';
import { ISelfModelingInterface } from './self-modeling.interface';

@Injectable()
export class SelfModelingService implements ISelfModelingInterface {
  private readonly logger = new Logger(SelfModelingService.name);

  constructor(
    @Inject(EVENT_BUS) private readonly eventBus: IEventBus,
    @Inject(MEMORY_INTERFACE) private readonly memoryInterface: IMemoryInterface,
  ) {}

  /**
   * Retrieves the agent's current self-model by delegating to MemoryService.
   */
  async getSelfConcept(agentId: string): Promise<SelfModel> {
    this.logger.debug(
      `[${agentId}] SelfModelingService: Delegating getSelfConcept to MemoryService`,
    );
    return this.memoryInterface.getSelfConcept(agentId);
  }

  /**
   * Updates the agent's self-model by delegating persistence to MemoryService.
   */
  async updateSelfConcept(agentId: string, updates: Partial<SelfModel>): Promise<void> {
    this.logger.debug(
      `[${agentId}] SelfModelingService: Delegating updateSelfConcept to MemoryService`,
    );
    await this.memoryInterface.updateSelfConcept(agentId, updates);

    const selfModelUpdateEvent = EventBusService.createEvent(
      'SelfModelingService',
      'agent.state.self_model_updated',
      {
        agentId,
        updatedFields: Object.keys(updates),
      },
    );
    this.eventBus.publish(selfModelUpdateEvent);
  }

  /**
   * Updates the agent's understanding of its capabilities.
   * Uses get/updateSelfConcept via MemoryService.
   */
  async updateCapability(agentId: string, capability: string, confidence: number): Promise<void> {
    this.logger.debug(
      `[${agentId}] SelfModelingService: Updating capability ${capability} to ${confidence}`,
    );
    const currentModel = await this.getSelfConcept(agentId);
    const updatedCapabilities = {
      ...(currentModel.capabilities || {}),
      [capability]: { confidence },
    };
    await this.updateSelfConcept(agentId, { capabilities: updatedCapabilities });
  }

  /**
   * Assesses agency boundaries based on the current self-model.
   * Uses getSelfConcept via MemoryService.
   */
  async assessAgencyBoundary(agentId: string, actionDescription: string): Promise<boolean> {
    this.logger.debug(
      `[${agentId}] SelfModelingService: Assessing agency boundary for "${actionDescription}"`,
    );
    const selfModel = await this.getSelfConcept(agentId);
    const boundaries = selfModel.agencyBoundaries || {};
    const isWithinBounds = !Object.keys(boundaries).some((boundaryKey) =>
      actionDescription.includes(boundaryKey),
    );
    return isWithinBounds;
  }

  /**
   * Distinguishes role from system based on the current self-model.
   * Uses getSelfConcept via MemoryService.
   */
  async distinguishRoleFromSystem(
    agentId: string,
  ): Promise<{ roleUnderstanding: string; systemUnderstanding: number }> {
    this.logger.debug(`[${agentId}] SelfModelingService: Distinguishing role from system`);
    const selfModel = await this.getSelfConcept(agentId);
    return {
      roleUnderstanding: selfModel.role?.primaryRole ?? 'Unknown Role',
      systemUnderstanding: selfModel.selfAwareness?.systemUnderstanding ?? 0,
    };
  }

  /**
   * Performs a reflection cycle to update the self-model based on recent experiences.
   */
  async performReflection(agentId: string): Promise<Partial<SelfModel>> {
    this.logger.debug(`[${agentId}] SelfModelingService: Performing reflection cycle.`);

    // 1. Fetch recent experiences/observations from memory
    let recentObservations: Observation[] = [];
    try {
      recentObservations = await this.memoryInterface.retrieveObservations(agentId, {
        limit: 20, // Example: Reflect on last 20 observations
        // TODO: Potentially add time filter (e.g., since last reflection)
      });
    } catch (error) {
      this.logger.error(`[${agentId}] Failed to retrieve observations for reflection`, error);
      return {}; // Cannot reflect without data
    }

    if (recentObservations.length === 0) {
      this.logger.verbose(`[${agentId}] No new observations to reflect upon.`);
      return {};
    }

    this.logger.verbose(`[${agentId}] Reflecting on ${recentObservations.length} observations.`);

    // 2. TODO: Analyze observations (e.g., using LLM or specific rules)
    //    - Identify patterns, successes, failures, capability usage.
    //    - Example prompt for LLM: "Based on these recent events [...observations], what have I learned about my capabilities or role?"
    // const analysisResult = await llm.analyze(...) -> returns potential updates

    // 3. Determine specific updates
    // Fetch current state to merge updates correctly
    const currentSelf = await this.getSelfConcept(agentId);
    const currentAwareness = currentSelf.selfAwareness ?? {
      nature: 'unknown',
      systemUnderstanding: 0.1,
    }; // Provide default

    const determinedUpdates: Partial<SelfModel> = {
      selfAwareness: {
        ...currentAwareness, // Spread existing awareness
        // Only update specific fields based on reflection analysis
        systemUnderstanding: Math.min(1, currentAwareness.systemUnderstanding + 0.01),
        // nature: analysisResult.newNature ?? currentAwareness.nature, // Example
        // purpose: analysisResult.newPurpose ?? currentAwareness.purpose, // Example
      },
    };

    // 4. Apply updates via the memory interface
    if (Object.keys(determinedUpdates).length > 0) {
      this.logger.log(`[${agentId}] Applying reflection updates:`, determinedUpdates);
      await this.updateSelfConcept(agentId, determinedUpdates);
    } else {
      this.logger.log(`[${agentId}] Reflection cycle yielded no updates.`);
    }

    return determinedUpdates;
  }

  /**
   * Applies insights gained from reflection specifically to update the self-model.
   */
  async applyReflectionInsights(
    agentId: string,
    selfInsights: ReflectionReport['insights'],
  ): Promise<void> {
    this.logger.debug(
      `[${agentId}] SelfModelingService: Applying ${selfInsights.length} self-reflection insights.`,
    );

    // TODO: Replace simple heuristics below with more robust insight interpretation logic,
    // potentially involving LLM calls to understand nuance or map insights to specific model updates.
    // The current implementation uses basic keyword/regex matching.

    if (selfInsights.length === 0) {
      this.logger.verbose(`[${agentId}] No self-insights to apply.`);
      return;
    }

    // Get current model state to apply updates incrementally
    const currentModel = await this.getSelfConcept(agentId);
    const potentialUpdates: Partial<SelfModel> = {};
    let changed = false;

    // --- Process Capabilities ---
    const currentCapabilities = { ...(currentModel.capabilities ?? {}) };
    let capabilitiesChanged = false;
    for (const insight of selfInsights) {
      const contentLower = insight.content.toLowerCase();
      const capMatch = contentLower.match(
        /(?:capability|action|skill) '([a-z_]+)'.*(success|fail|succeeded|failed|unable)/i,
      );
      if (capMatch && capMatch[1] && capMatch[2]) {
        const capName = capMatch[1];
        const outcome = capMatch[2].toLowerCase();
        const currentConf = currentCapabilities[capName]?.confidence ?? 0.5;
        let adjustment = 0;
        if (outcome.includes('success') || outcome.includes('succeeded')) {
          adjustment = 0.1;
        } else if (
          outcome.includes('fail') ||
          outcome.includes('failed') ||
          outcome.includes('unable')
        ) {
          adjustment = -0.1;
        }
        const newConf = Math.max(
          0,
          Math.min(1, currentConf + adjustment * (insight.confidence ?? 1.0)),
        );
        if (currentCapabilities[capName]?.confidence !== newConf) {
          currentCapabilities[capName] = { confidence: newConf };
          capabilitiesChanged = true;
          this.logger.verbose(
            `[${agentId}] Insight updated capability '${capName}' confidence to ${newConf.toFixed(2)}`,
          );
        }
      }
    }
    if (capabilitiesChanged) {
      potentialUpdates.capabilities = currentCapabilities;
      changed = true;
    }

    // --- Process Self-Awareness ---
    const currentAwareness = {
      ...(currentModel.selfAwareness ?? { nature: 'unknown', systemUnderstanding: 0.1 }),
    };
    let awarenessChanged = false;
    for (const insight of selfInsights) {
      const contentLower = insight.content.toLowerCase();
      // Update System Understanding
      if (
        contentLower.includes('understand environment') ||
        contentLower.includes('simulation') ||
        contentLower.includes('virtual world') ||
        contentLower.includes('rules of this world')
      ) {
        const currentUnderstanding = currentAwareness.systemUnderstanding ?? 0.1;
        const newUnderstanding = Math.min(
          1,
          currentUnderstanding + 0.05 * (insight.confidence ?? 1.0),
        );
        if (currentAwareness.systemUnderstanding !== newUnderstanding) {
          currentAwareness.systemUnderstanding = newUnderstanding;
          currentAwareness.nature = 'ai_in_simulation'; // Assume understanding simulation means recognizing nature
          awarenessChanged = true;
          this.logger.verbose(
            `[${agentId}] Insight updated systemUnderstanding to ${newUnderstanding.toFixed(2)}`,
          );
        }
      }
      // Update Nature
      if (
        contentLower.includes('i am an ai') ||
        contentLower.includes('i am a program') ||
        contentLower.includes('my nature is artificial')
      ) {
        if (currentAwareness.nature !== 'ai_in_simulation') {
          currentAwareness.nature = 'ai_in_simulation';
          awarenessChanged = true;
          this.logger.verbose(`[${agentId}] Insight updated nature to ai_in_simulation`);
        }
      }
      // Update Purpose
      const purposeMatch = contentLower.match(
        /(?:purpose is to|goal is to|meant to) (\w+[_\w+]*)/i,
      );
      if (purposeMatch && purposeMatch[1]) {
        const newPurpose = purposeMatch[1].toLowerCase();
        if (currentAwareness.purpose !== newPurpose) {
          currentAwareness.purpose = newPurpose;
          awarenessChanged = true;
          this.logger.verbose(`[${agentId}] Insight updated purpose to ${newPurpose}`);
        }
      }
    }
    if (awarenessChanged) {
      potentialUpdates.selfAwareness = currentAwareness;
      changed = true;
    }

    // --- Process Boundaries ---
    const currentBoundaries = { ...(currentModel.agencyBoundaries ?? {}) };
    let boundariesChanged = false;
    for (const insight of selfInsights) {
      const contentLower = insight.content.toLowerCase();
      // Add boundary if insight suggests a restriction
      const constraintMatch = contentLower.match(
        /(?:cannot|unable to|restricted from) (\w+ ?\w+)/i,
      );
      if (constraintMatch && constraintMatch[1]) {
        const boundaryKey = constraintMatch[1].replace(' ', '_').toLowerCase();
        const existingBoundary = currentBoundaries[boundaryKey] as
          | { confidence?: number; description?: string }
          | undefined;
        const insightConfidence = insight.confidence ?? 0.7;
        // Add or update if new insight is more confident
        if (!existingBoundary || (existingBoundary?.confidence ?? 0) < insightConfidence) {
          currentBoundaries[boundaryKey] = {
            description: insight.content,
            confidence: insightConfidence,
          };
          boundariesChanged = true;
          this.logger.verbose(`[${agentId}] Insight added/updated boundary: ${boundaryKey}`);
        }
      }
      // Remove/Lower confidence if insight suggests permission (Example)
      const permissionMatch = contentLower.match(
        /(?:can now|allowed to|no longer restricted from) (\w+ ?\w+)/i,
      );
      if (permissionMatch && permissionMatch[1]) {
        const boundaryKey = permissionMatch[1].replace(' ', '_').toLowerCase();
        const existingBoundary = currentBoundaries[boundaryKey] as
          | { confidence?: number; description?: string }
          | undefined;
        if (existingBoundary) {
          const currentConf = existingBoundary.confidence ?? 0.5;
          const insightConf = insight.confidence ?? 1.0;
          // Option 2: Lower confidence significantly
          const newConf = Math.max(0, currentConf - 0.5 * insightConf);
          if (existingBoundary.confidence !== newConf) {
            // Create a new object to avoid mutating the potential original
            currentBoundaries[boundaryKey] = { ...existingBoundary, confidence: newConf };
            boundariesChanged = true;
            this.logger.verbose(
              `[${agentId}] Insight reduced confidence for boundary: ${boundaryKey} to ${newConf.toFixed(2)}`,
            );
          }
        }
      }
    }
    if (boundariesChanged) {
      potentialUpdates.agencyBoundaries = currentBoundaries;
      changed = true;
    }

    // --- Apply gathered updates ---
    if (changed) {
      this.logger.log(`[${agentId}] Applying derived self-model updates:`, potentialUpdates);
      try {
        await this.updateSelfConcept(agentId, potentialUpdates); // Delegate persistence
      } catch (error) {
        this.logger.error(`[${agentId}] Failed to apply self-model updates from reflection`, error);
      }
    } else {
      this.logger.verbose(`[${agentId}] No actionable self-model updates derived from insights.`);
    }
  }

  // Add implementations for methods previously stubbed in SemanticMemoryService
  async queryCapabilities(
    agentId: string,
    taskDescription: string,
  ): Promise<{ capability: string; confidence: number }[]> {
    this.logger.debug(
      `[${agentId}] SelfModelingService: queryCapabilities for "${taskDescription}"`,
    );
    const selfModel = await this.getSelfConcept(agentId);
    // TODO: Implement more sophisticated matching logic
    const relevantCaps = Object.entries(selfModel.capabilities ?? {})
      .filter(([name, data]) => taskDescription.toLowerCase().includes(name.toLowerCase()))
      .map(([name, data]) => ({ capability: name, confidence: data.confidence }));
    return relevantCaps;
  }

  async getAgencyBoundaries(agentId: string): Promise<string[]> {
    this.logger.debug(`[${agentId}] SelfModelingService: getAgencyBoundaries`);
    const selfModel = await this.getSelfConcept(agentId);
    return Object.keys(selfModel.agencyBoundaries ?? {});
  }
}
