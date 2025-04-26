import { Inject, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import {
  AgentConfig,
  AgentDynamicState,
  AgentDynamicStateUpdatedPayload,
  AgentPerceptionEvent,
  AgentState,
} from '@pixeltales/contracts';
import { setInterval } from 'timers';
import { EVENT_BUS, IEventBus } from '../core/event-bus.interface';
import { EventBusService } from '../core/event-bus.service';
import { ISimulationService, SIMULATION_SERVICE } from '../simulation/simulation.interface';
import { AgentFactory } from './agent.factory';
import { AgentRuntimeState } from './agent.state';
import { CognitiveCycleService } from './cognitive-cycle/cognitive-cycle.service';
import { IReflectionService, REFLECTION_SERVICE } from './reflection/reflection.interface';

@Injectable()
export class AgentService implements OnModuleInit {
  private readonly logger = new Logger(AgentService.name);
  // Map stores the current state of active agents
  private activeAgents = new Map<string, AgentRuntimeState>();
  // Store interval timers for agent loops
  private agentLoops = new Map<string, NodeJS.Timeout>();
  private readonly TICK_INTERVAL_MS = 30000; // Slower interval (30s)
  private readonly IDLE_THRESHOLD_MS = 60000; // Reflect if idle for 1 minute

  constructor(
    private readonly agentFactory: AgentFactory,
    private readonly cognitiveCycleService: CognitiveCycleService,
    @Inject(SIMULATION_SERVICE) private readonly simulationService: ISimulationService,
    @Inject(EVENT_BUS) private readonly eventBus: IEventBus,
    @Inject(REFLECTION_SERVICE) private readonly reflectionService: IReflectionService,
  ) {}

  /**
   * Subscribe to perception events when the module initializes.
   */
  onModuleInit() {
    this.logger.log('AgentService initialized, subscribing to perception events...');
    // Subscribe to specific known perception event types
    const perceptionEventTypes: AgentPerceptionEvent['type'][] = [
      'perception.message',
      'perception.enter',
      'perception.leave',
      'perception.scene_update',
      // Add other perception types here as they are defined/needed
    ];
    perceptionEventTypes.forEach((eventType) => {
      this.eventBus.subscribe(eventType, this.handleIncomingPerception.bind(this));
    });
    this.logger.log(`Subscribed to perception events: ${perceptionEventTypes.join(', ')}`);
  }

  /**
   * Handles incoming perception events from the event bus.
   * Filters events based on whether they target an active agent managed by this service.
   */
  private async handleIncomingPerception(event: AgentPerceptionEvent): Promise<void> {
    // FIXME: Implement robust target identification logic here!
    // This placeholder assumes the payload *might* have a targetAgentId.
    // A real implementation might check visualIds against agent states,
    // check scene coordinates, or rely on explicit routing info in the event.
    let targetAgentId: string | undefined = undefined;
    if ('targetAgentId' in event.payload && typeof event.payload.targetAgentId === 'string') {
      targetAgentId = event.payload.targetAgentId;
    }
    // Add more logic here to determine target based on event.type and payload details
    // e.g., for a message, check if targetVisualId matches an active agent's visualId

    // If no specific target identified by the payload, consider it a potential broadcast
    // or environment update relevant to all agents in the vicinity/scene.
    // For now, we only process specifically targeted events.
    if (!targetAgentId) {
      // Or, if broadcast, iterate through all active agents?
      // this.logger.verbose(`Ignoring non-targeted perception event: ${event.type}`);
      return;
    }

    // Check if the target agent is active and managed by this service instance
    const agent = this.activeAgents.get(targetAgentId);
    if (!agent) {
      // Not an agent managed by this service instance
      return;
    }

    this.logger.verbose(
      `[${targetAgentId}] Received targeted perception ${event.type} via event bus.`,
    );
    agent.addPerception(event);
    // Immediately try to process buffered perceptions
    await this._tryProcessAgentPerceptions(targetAgentId);
  }

  /**
   * Creates an agent's initial state, adds it to the active pool,
   * and starts its cognitive loop.
   * @param config Static configuration for the agent.
   * @param agentId Optional specific ID for the agent.
   * @returns The ID of the newly spawned agent.
   */
  async spawnAgent(config: AgentConfig, agentId?: string): Promise<string> {
    const initialAgentState = this.agentFactory.create(config, agentId);
    const id = initialAgentState.agentId;

    if (this.activeAgents.has(id)) {
      // This should ideally not happen if AgentFactory handles ID generation/checking,
      // but added as a safeguard.
      throw new Error(`Agent with ID ${id} already exists.`);
    }

    this.logger.log(`Spawning agent ${id}...`);
    // Store the runtime state
    this.activeAgents.set(id, initialAgentState);

    // Start the agent's background processing loop
    this.startAgentBackgroundLoop(id);
    this.logger.log(`Agent ${id} background loop started.`);
    return id;
  }

  /**
   * Starts the periodic background processing loop for an agent.
   */
  private startAgentBackgroundLoop(agentId: string): void {
    if (this.agentLoops.has(agentId)) {
      this.logger.warn(`[${agentId}] Background loop already started.`);
      return;
    }
    this.logger.log(
      `[${agentId}] Starting background loop (Interval: ${this.TICK_INTERVAL_MS}ms)...`,
    );

    const intervalId = setInterval(() => {
      (async () => {
        const agent = this.activeAgents.get(agentId);
        if (!agent) {
          this.logger.error(
            `[${agentId}] Agent not found in active agents. Stopping background loop.`,
          );
          this.stopAgentBackgroundLoop(agentId); // Use the dedicated stop method
          return;
        }

        // Check for idleness before trying to process
        const now = Date.now();
        if (now - agent.lastActivityTimestamp > this.IDLE_THRESHOLD_MS && !agent.isProcessing) {
          this.logger.verbose(`[${agentId}] Agent idle, triggering periodic reflection...`);
          // Trigger reflection but don't wait for it
          this.reflectionService.performReflection(agentId, 'periodic_idle').catch((err: any) => {
            this.logger.error(`[${agentId}] Background reflection trigger failed:`, err);
          });
          agent.lastActivityTimestamp = now; // Update timestamp after triggering reflection
        }

        // Try processing any buffered perceptions (non-blocking call)
        await this._tryProcessAgentPerceptions(agentId);
      })().catch((error: any) => {
        this.logger.error(`[${agentId}] Unhandled error in background loop interval:`, error);
      });
    }, this.TICK_INTERVAL_MS);

    this.agentLoops.set(agentId, intervalId);
  }

  /**
   * Stops the background processing loop for a specific agent.
   */
  private stopAgentBackgroundLoop(agentId: string): void {
    const intervalId = this.agentLoops.get(agentId);
    if (intervalId) {
      clearInterval(intervalId);
      this.agentLoops.delete(agentId);
      this.logger.log(`Stopped background processing loop for agent ${agentId}`);
    } else {
      this.logger.warn(`No active background loop found for agent ${agentId} to stop.`);
    }
  }

  /**
   * Attempts to process buffered perceptions for an agent sequentially.
   * Uses a flag to prevent concurrent processing.
   */
  private async _tryProcessAgentPerceptions(agentId: string): Promise<void> {
    const agent = this.activeAgents.get(agentId);
    if (!agent) {
      this.logger.warn(`[${agentId}] Attempted to process perceptions for inactive agent.`);
      return;
    }

    if (agent.isProcessing) {
      this.logger.verbose(
        `[${agentId}] Already processing, skipping _tryProcessAgentPerceptions call.`,
      );
      return;
    }

    if (agent.perceptionBuffer.length === 0) {
      return; // Nothing to process
    }

    this.logger.debug(`[${agentId}] Starting sequential perception processing...`);
    agent.isProcessing = true;

    try {
      let perception = agent.getNextPerception();
      while (perception) {
        this.logger.debug(`[${agentId}] Processing buffered perception ${perception.type}...`);
        const { action: resultingAction, stateUpdates } =
          await this.cognitiveCycleService.processPerceptionEvent(agent, perception);

        if (stateUpdates && Object.keys(stateUpdates).length > 0) {
          this.updateAgentDynamicState(agentId, stateUpdates);
        }

        agent.lastActivityTimestamp = Date.now();

        this.logger.debug(
          `[${agentId}] Cycle for ${perception.type} complete. Action: ${resultingAction.type}`,
        );
        perception = agent.getNextPerception();
      }
    } catch (error) {
      this.logger.error(`[${agentId}] Error during sequential perception processing:`, error);
    } finally {
      agent.isProcessing = false;
      this.logger.debug(`[${agentId}] Finished sequential perception processing.`);
    }
  }

  /**
   * Retrieves the current state of an active agent by its ID.
   * @param agentId The ID of the agent to retrieve.
   * @returns The agent's current state (without runtime-specific properties).
   * @throws NotFoundException if agent is not active.
   */
  getAgentState(agentId: string): AgentState {
    const agentRuntimeState = this.activeAgents.get(agentId);
    if (!agentRuntimeState) {
      throw new NotFoundException(`Agent with ID ${agentId} not found or not active.`);
    }

    // Return a basic AgentState without the runtime-specific properties
    return {
      agentId: agentRuntimeState.agentId,
      config: agentRuntimeState.config,
      dynamicState: agentRuntimeState.dynamicState,
    };
  }

  /**
   * Stops an agent's cognitive loop and removes it from the active pool.
   * @param agentId The ID of the agent to despawn.
   */
  async despawnAgent(agentId: string): Promise<void> {
    this.logger.log(`Despawning agent ${agentId}...`);
    this.stopAgentBackgroundLoop(agentId); // Stop the background loop

    const agentState = this.activeAgents.get(agentId);
    if (agentState) {
      // Optional: Call cognitiveCycleService.stopAgentLoop for any internal cleanup
      try {
        await this.cognitiveCycleService.stopAgentLoop(agentState);
      } catch (error) {
        this.logger.error(`Error during cognitive cycle stop for agent ${agentId}`, error);
      }

      // TODO: Perform any final cleanup (e.g., save final state to DB?)
      this.activeAgents.delete(agentId);
      this.logger.log(`Agent ${agentId} despawned and removed from active pool.`);
    } else {
      this.logger.warn(`Agent with ID ${agentId} not found for despawning.`);
    }
  }

  /**
   * Updates the dynamic state of an active agent and emits an event.
   * @param agentId The ID of the agent.
   * @param updates Partial updates to apply to the dynamic state.
   */
  updateAgentDynamicState(agentId: string, updates: Partial<AgentDynamicState>): void {
    const currentAgentRuntimeState = this.activeAgents.get(agentId);
    if (!currentAgentRuntimeState) {
      this.logger.warn(`Cannot update state for non-existent agent ${agentId}`);
      return;
    }

    // Create a new dynamic state object by merging the existing one with updates
    const newDynamicState: AgentDynamicState = {
      ...currentAgentRuntimeState.dynamicState,
      ...updates,
    };

    // Update the dynamicState property of the *existing* runtime state object
    currentAgentRuntimeState.dynamicState = newDynamicState;

    // Emit event about the state change
    try {
      const payload: AgentDynamicStateUpdatedPayload = {
        agentId: agentId,
        updates: updates,
        newState: newDynamicState,
      };

      // Use the static createEvent method
      const event = EventBusService.createEvent(
        AgentService.name, // Source
        'agent.state.dynamic.updated', // Type
        payload, // Payload
      );

      // Publish the created event object
      this.eventBus.publish(event);

      this.logger.verbose(`[${agentId}] Emitted agent.state.dynamic.updated event.`);
    } catch (error) {
      this.logger.error(`[${agentId}] Failed to emit dynamic state update event`, error);
    }

    this.logger.verbose(`Updated dynamic state for agent ${agentId}`);
  }

  /**
   * Lists the IDs of all currently active agents.
   * @returns An array of active agent IDs.
   */
  listActiveAgents(): string[] {
    return Array.from(this.activeAgents.keys());
  }

  /**
   * Gets all active agent states.
   * Use cautiously, could be large.
   * @returns An array of active agent states (without runtime-specific properties).
   */
  getAllAgentStates(): AgentState[] {
    // Convert runtime states to basic states
    return Array.from(this.activeAgents.values()).map((runtimeState) => ({
      agentId: runtimeState.agentId,
      config: runtimeState.config,
      dynamicState: runtimeState.dynamicState,
    }));
  }
}
