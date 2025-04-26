import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  AgentMovedSimulationStatePayloadSchema,
  AgentPerceptionEvent,
  RawSimulationEvent,
  SimulationAgentActionEvent,
  SpeechOccurredSimulationEventPayloadSchema,
} from '@pixeltales/contracts';
import { z } from 'zod';
import { AgentService } from '../agent/agent.service';
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

  constructor(
    @Inject(EVENT_BUS) private readonly eventBus: IEventBus,
    @Inject(AgentService) private readonly agentService: AgentService,
  ) {
    // Subscribe to specific known simulation event types
    const eventTypesToHandle: SimulationAgentActionEvent['type'][] = [
      'simulation.agent.speak',
      'simulation.agent.move',
      // Add other types here as they are defined
    ];
    eventTypesToHandle.forEach((eventType) => {
      this.eventBus.subscribe(eventType, (event: SimulationAgentActionEvent) =>
        this.handleAgentAction(event),
      );
    });
    this.logger.log(
      `SimulationService Initialized - Listening for: ${eventTypesToHandle.join(', ')}`,
    );
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

    // Determine perceiving agents (placeholder logic)
    const allAgentIds = this.agentService.listActiveAgents();
    const perceivingAgentIds = this.determinePerceivingAgents(
      actingAgentId,
      allAgentIds,
      event.type,
      event.payload,
    );

    if (perceivingAgentIds.length === 0) return;

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
        `Published raw simulation event ${rawEventToPublish.type} from ${actingAgentId}`,
      );
    } else {
      this.logger.warn(`No raw simulation event generated for action: ${event.type}`);
    }
  }

  /**
   * Determines which agents should perceive an event based on simple rules.
   * TODO: Replace with actual simulation logic (proximity, line-of-sight etc.)
   */
  private determinePerceivingAgents(
    actingAgentId: string,
    allAgentIds: string[],
    simulationEventType: SimulationAgentActionEvent['type'],
    payload: any,
  ): string[] {
    const others = allAgentIds.filter((id) => id !== actingAgentId);
    if (simulationEventType === 'simulation.agent.speak') {
      const actingPos = this.agentPositions.get(actingAgentId) ?? { x: 0, y: 0 };
      const hearingRange = 50;
      return others.filter((id) => {
        const targetPos = this.agentPositions.get(id) ?? { x: 1000, y: 1000 };
        const dx = actingPos.x - targetPos.x;
        const dy = actingPos.y - targetPos.y;
        return dx * dx + dy * dy < hearingRange * hearingRange;
      });
    } else if (simulationEventType === 'simulation.agent.move') {
      return others;
    }
    this.logger.warn(
      `Unhandled simulation event type in determinePerceivingAgents: ${simulationEventType as string}`,
    );
    return [];
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
