import { Inject, Injectable, Logger } from '@nestjs/common';
import { Observation, SelfModel } from '@pixeltales/contracts';
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
