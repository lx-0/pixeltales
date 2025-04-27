import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  AgentDestroyedEvent,
  AgentMovedSimulationStatePayloadSchema,
  AgentPerceptionEvent,
  AgentSpawnedEvent,
  PerceiverContext,
  RawSimulationEvent,
  SimulationAgentActionEvent,
  SpeechOccurredSimulationEventPayloadSchema,
} from '@pixeltales/contracts';
import { z } from 'zod';
import { EVENT_BUS, IEventBus } from '../core/event-bus.interface';
import { EventBusService } from '../core/event-bus.service';
import { ISimulationService } from './simulation.interface';

/**
 * Placeholder Simulation Service.
 * In a real implementation, this would manage the scene state, physics,
 * and determine what agents perceive based on events and proximity.
 */

// Simple placeholder type for position
type AgentPosition = { x: number; y: number };

@Injectable()
export class SimulationService implements ISimulationService {
  private readonly logger = new Logger(SimulationService.name);
  // Placeholder for simulation state - Replace with actual state management
  private agentPositions = new Map<string, AgentPosition>();
  private activeAgentIds = new Set<string>();

  constructor(@Inject(EVENT_BUS) private readonly eventBus: IEventBus) {
    // Subscribe to agent action events
    const actionEventTypes: SimulationAgentActionEvent['type'][] = [
      'simulation.agent.speak',
      'simulation.agent.move',
    ];
    actionEventTypes.forEach((eventType) => {
      this.eventBus.subscribe(eventType, (event: SimulationAgentActionEvent) =>
        this.handleAgentAction(event),
      );
    });
    this.logger.log(`Subscribed to agent actions: ${actionEventTypes.join(', ')}`);

    // Subscribe to agent lifecycle events
    this.eventBus.subscribe('agent.lifecycle.spawned', (event: AgentSpawnedEvent) => {
      const agentId = event?.payload?.agentId;
      if (agentId && typeof agentId === 'string') {
        this.activeAgentIds.add(agentId);
        this.logger.log(`Agent ${agentId} added to simulation active list.`);
        // Initialize position if needed
        if (!this.agentPositions.has(agentId)) {
          this.agentPositions.set(agentId, { x: Math.random() * 100, y: Math.random() * 100 }); // Example init
        }
      }
    });
    this.eventBus.subscribe('agent.lifecycle.destroyed', (event: AgentDestroyedEvent) => {
      const agentId = event?.payload?.agentId;
      if (agentId && typeof agentId === 'string') {
        this.activeAgentIds.delete(agentId);
        this.agentPositions.delete(agentId); // Clean up position too
        this.logger.log(`Agent ${agentId} removed from simulation active list.`);
      }
    });
    this.logger.log(`Subscribed to agent lifecycle events (spawned, destroyed)`);
  }

  /**
   * Handles simulation events (agent actions), generates perceptions, and publishes them.
   */
  private handleAgentAction(event: SimulationAgentActionEvent): void {
    const actingAgentId = event.payload.agentId;
    if (!actingAgentId) {
      this.logger.error(`Simulation event missing agentId: ${event.type}`);
      return;
    }
    this.logger.debug(`Simulation received action event: ${event.type} from ${actingAgentId}`);

    // Update internal state (placeholder)
    let newPosition: AgentPosition | undefined;
    if (event.type === 'simulation.agent.move') {
      newPosition = { x: Math.random() * 200, y: Math.random() * 150 };
      this.agentPositions.set(actingAgentId, newPosition);
      this.logger.verbose(`[${actingAgentId}] Position updated.`);
    }

    // Determine perceiving agents AND their context
    const allAgentIds = Array.from(this.activeAgentIds);
    const perceiverContextList = this.determinePerceiverContext(
      actingAgentId,
      allAgentIds,
      event.type,
      event.payload,
    );

    // Note: We still publish the raw event even if no perceivers are calculated by the sim,
    // in case other systems (like a global observer) care about the raw event itself.
    // The perceiver list might be empty.

    // Publish RAW simulation state/event info for Perception Extensions to process
    let rawEventToPublish: RawSimulationEvent | null = null;

    switch (event.type) {
      case 'simulation.agent.speak': {
        const simPayload = event.payload;
        const payload: z.infer<typeof SpeechOccurredSimulationEventPayloadSchema> = {
          agentId: actingAgentId,
          content: simPayload.content ?? '',
          tone: simPayload.tone,
          position: this.agentPositions.get(actingAgentId),
          perceiverContextList: perceiverContextList,
        };
        rawEventToPublish = EventBusService.createEvent(
          SimulationService.name,
          'simulation.event.speech_occurred',
          payload,
        );
        break;
      }
      case 'simulation.agent.move': {
        const simPayload = event.payload;
        const payload: z.infer<typeof AgentMovedSimulationStatePayloadSchema> = {
          agentId: actingAgentId,
          newPosition: this.agentPositions.get(actingAgentId)!,
          previousPosition: undefined,
          metadata: { target: simPayload.target },
          perceiverContextList: perceiverContextList,
        };
        rawEventToPublish = EventBusService.createEvent(
          SimulationService.name,
          'simulation.state.agent_moved',
          payload,
        );
        break;
      }
      default: {
        const _exhaustiveCheck: never = event;
        this.logger.warn(
          `Simulation received unhandled action event type: ${(_exhaustiveCheck as { type: string })?.type}`,
        );
        return;
      }
    }

    if (rawEventToPublish) {
      this.eventBus.publish(rawEventToPublish);
      this.logger.debug(
        `Published raw simulation event ${rawEventToPublish.type} from ${actingAgentId} (Perceiver Contexts: ${perceiverContextList.length})`,
      );
    } else {
      this.logger.warn(`No raw simulation event generated for action: ${event.type}`);
    }
  }

  /**
   * Determines which agents should perceive an event and calculates context for each.
   * TODO: Replace with actual simulation logic (proximity, line-of-sight etc.)
   */
  private determinePerceiverContext<T extends SimulationAgentActionEvent['type']>(
    actingAgentId: string,
    allAgentIds: string[],
    simulationEventType: T,
    _payload: Extract<SimulationAgentActionEvent, { type: T }>['payload'], // Payload might be needed for more complex rules later
  ): PerceiverContext[] {
    const perceivers: PerceiverContext[] = [];
    const others = allAgentIds.filter((id) => id !== actingAgentId);
    const actingPos = this.agentPositions.get(actingAgentId) ?? { x: 0, y: 0 };

    for (const potentialPerceiverId of others) {
      const targetPos = this.agentPositions.get(potentialPerceiverId) ?? { x: 1000, y: 1000 };
      const dx = actingPos.x - targetPos.x;
      const dy = actingPos.y - targetPos.y;
      const distSq = dx * dx + dy * dy;

      // Example Rules based on type
      let canPerceive = false;
      let distance: number | undefined = undefined;

      if (simulationEventType === 'simulation.agent.speak') {
        const hearingRangeSq = 50 * 50;
        if (distSq < hearingRangeSq) {
          canPerceive = true;
          distance = Math.sqrt(distSq);
        }
      } else if (simulationEventType === 'simulation.agent.move') {
        const visualRangeSq = 100 * 100;
        if (distSq < visualRangeSq) {
          canPerceive = true;
          distance = Math.sqrt(distSq);
          // TODO: Add line-of-sight check here
        }
      } else {
        this.logger.warn(
          `Unhandled simulation event type in determinePerceiverContext: ${simulationEventType as string}`,
        );
      }

      if (canPerceive) {
        perceivers.push({
          perceiverAgentId: potentialPerceiverId,
          distance: distance, // Add calculated distance
          // Add other context here if needed
        });
      }
    }
    return perceivers;
  }

  /**
   * Gets the next perception event for an agent - Now returns null as perceptions are event-driven.
   * Kept for interface compliance, but should not be actively polled.
   * @deprecated
   */
  async getNextPerception(agentId: string): Promise<AgentPerceptionEvent | null> {
    this.logger.warn(
      `[${agentId}] getNextPerception was called, but perceptions are now push-based via EventBus. Returning null.`,
    );
    return null;
  }

  /**
   * Receives notification of an action performed by an agent.
   */
  async notifyAction(agentId: string, actionDetails: any): Promise<void> {
    // This is an alternative way (push) for actions to affect the simulation
    // vs. listening to events (pull/subscribe).
    this.logger.debug(`Simulation notified of action by ${agentId}:`, actionDetails);
    // TODO: Update internal simulation state based on action
    // TODO: Generate perception events for other agents based on this action
  }
}
