import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  AgentConfig,
  AgentDynamicState,
  AgentDynamicStateUpdatedPayload,
  AgentPerceptionEvent,
  AgentState,
} from '@pixeltales/contracts';
import { EVENT_BUS, IEventBus } from '../core/event-bus.interface';
import { EventBusService } from '../core/event-bus.service';
import { ISimulationService, SIMULATION_SERVICE } from '../simulation/simulation.interface';
import { AgentFactory } from './agent.factory';
import { AgentRuntimeState } from './agent.state';
import { CognitiveCycleService } from './cognitive-cycle/cognitive-cycle.service';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  // Map stores the current state of active agents
  private activeAgents = new Map<string, AgentRuntimeState>();
  // Store interval timers for agent loops
  private agentLoops = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly agentFactory: AgentFactory,
    private readonly cognitiveCycleService: CognitiveCycleService,
    @Inject(SIMULATION_SERVICE) private readonly simulationService: ISimulationService,
    @Inject(EVENT_BUS) private readonly eventBus: IEventBus,
  ) {}

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

    // Start the agent's cognitive processing loop
    this.startAgentProcessingLoop(id);
    this.logger.log(`Agent ${id} cognitive loop started.`);
    return id;
  }

  /**
   * Starts the cognitive processing loop for a specific agent.
   * Uses a simple interval timer for now.
   * @param agentId The ID of the agent.
   */
  private startAgentProcessingLoop(agentId: string): void {
    if (this.agentLoops.has(agentId)) {
      this.logger.warn(`[${agentId}] Processing loop already started.`);
      return;
    }

    this.logger.log(`[${agentId}] Starting processing loop...`);

    const intervalId = setInterval(() => {
      (async () => {
        const currentState = this.activeAgents.get(agentId);

        if (!currentState) {
          this.logger.error(`[${agentId}] Agent not found in active agents. Stopping loop.`);
          clearInterval(intervalId);
          this.agentLoops.delete(agentId);
          return;
        }

        // Skip if agent is already processing
        if (currentState.isProcessing) {
          this.logger.verbose(`[${agentId}] Agent is already processing. Skipping this cycle.`);
          return;
        }

        // Get next perception from buffer
        const perception = currentState.getNextPerception();

        // Only run cycle if there's a perception to process
        if (perception) {
          try {
            // Mark as processing to prevent concurrent cycles
            currentState.isProcessing = true;

            this.logger.debug(`[${agentId}] Triggering cognitive cycle with ${perception.type}...`);
            const { action: resultingAction, stateUpdates } =
              await this.cognitiveCycleService.processPerceptionEvent(currentState, perception);

            // --- Apply State Updates --- //
            if (stateUpdates && Object.keys(stateUpdates).length > 0) {
              this.logger.verbose(
                `[${agentId}] Applying state updates: ${JSON.stringify(stateUpdates)}`,
              );
              // Call the service method to update the state in the map
              this.updateAgentDynamicState(agentId, stateUpdates);
            } else {
              this.logger.verbose(`[${agentId}] No state updates returned from cycle.`);
            }

            this.logger.debug(
              `[${agentId}] Cycle complete. Resulting action: ${resultingAction.type}`,
            );

            // Done processing
            currentState.isProcessing = false;
          } catch (cycleError) {
            this.logger.error(`[${agentId}] Error in scheduled cognitive cycle:`, cycleError);
            // Reset processing flag in case of error
            currentState.isProcessing = false;
          }
        } else {
          // Optional: Log agent idle state if no perception
          this.logger.verbose(`[${agentId}] No perceptions in buffer, skipping cycle.`);
        }
      })().catch((error) => {
        this.logger.error(
          `[${agentId}] Unhandled promise rejection in agent loop interval:`,
          error,
        );
        // Reset the processing flag in case of error
        const agent = this.activeAgents.get(agentId);
        if (agent) {
          agent.isProcessing = false;
        }
      });
    }, 5000); // Adjust interval as needed

    this.agentLoops.set(agentId, intervalId);
  }

  /**
   * Stops the cognitive processing loop for a specific agent.
   * @param agentId The ID of the agent.
   */
  private stopAgentProcessingLoop(agentId: string): void {
    const intervalId = this.agentLoops.get(agentId);
    if (intervalId) {
      clearInterval(intervalId);
      this.agentLoops.delete(agentId);
      this.logger.log(`Stopped processing loop for agent ${agentId}`);
    } else {
      this.logger.warn(`No active loop found for agent ${agentId} to stop.`);
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
    this.stopAgentProcessingLoop(agentId); // Stop the interval timer

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

  public async handlePerception(agentId: string, perception: AgentPerceptionEvent): Promise<void> {
    const agent = this.activeAgents.get(agentId);
    if (!agent) {
      this.logger.warn(`[${agentId}] Perception received for inactive agent.`);
      return;
    }

    // Add to the perception buffer instead of processing immediately
    agent.addPerception(perception);
    this.logger.verbose(`[${agentId}] Added perception to buffer: ${perception.type}`);
  }
}
