import { Inject, Injectable, Logger } from '@nestjs/common';
import { AgentPerceptionEvent, SimulationAgentActionEvent } from '@pixeltales/contracts';
import { AgentService } from '../agent/agent.service';
import { EVENT_BUS, IEventBus } from '../core/event-bus.interface';
import { EventBusService } from '../core/event-bus.service';
import { ISimulationService } from './simulation.interface';

/**
 * Placeholder Simulation Service.
 * In a real implementation, this would manage the scene state, physics,
 * and determine what agents perceive based on events and proximity.
 */
@Injectable()
export class SimulationService implements ISimulationService {
  private readonly logger = new Logger(SimulationService.name);

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
      this.eventBus.subscribe(eventType, this.handleAgentAction.bind(this));
    });
    this.logger.log(
      `SimulationService Initialized - Listening for: ${eventTypesToHandle.join(', ')}`,
    );
  }

  /**
   * Handles events emitted by Capability Extensions, generating and publishing perceptions.
   */
  private handleAgentAction(event: SimulationAgentActionEvent): void {
    const actingAgentId = event.payload.agentId;
    if (!actingAgentId) {
      this.logger.error(`Simulation event missing agentId: ${event.type}`);
      return;
    }
    this.logger.debug(`Simulation received action event: ${event.type} from ${actingAgentId}`);

    let perceptionPayload: AgentPerceptionEvent['payload'] | null = null;
    let perceptionType: AgentPerceptionEvent['type'] | null = null;

    switch (event.type) {
      case 'simulation.agent.speak': {
        const simPayload = event.payload;
        perceptionType = 'perception.message';
        perceptionPayload = {
          sourceVisualId: actingAgentId,
          content: simPayload.content ?? '',
          metadata: { tone: simPayload.tone },
        };
        break;
      }
      case 'simulation.agent.move': {
        const simPayload = event.payload;
        perceptionType = 'perception.agent_moved';
        const newPosition = { x: Math.random() * 100, y: Math.random() * 100 };
        perceptionPayload = {
          sourceVisualId: actingAgentId,
          visualId: actingAgentId,
          newPosition: newPosition,
          metadata: { target: simPayload.target },
        };
        break;
      }
      default: {
        // This case should ideally be unreachable if subscribed types match union
        const _exhaustiveCheck: never = event;
        this.logger.warn(
          `Simulation received unhandled REGISTERED action event type: ${(_exhaustiveCheck as { type: string })?.type}`,
        );
        break;
      }
    }

    if (perceptionPayload && perceptionType) {
      const activeAgentIds = this.agentService.listActiveAgents();
      const perceivingAgentIds = activeAgentIds.filter((id) => id !== actingAgentId);

      this.logger.debug(
        `Publishing perception ${perceptionType} to agents: ${perceivingAgentIds.join(', ')}`,
      );

      perceivingAgentIds.forEach((targetAgentId) => {
        const perceptionEvent = EventBusService.createEvent(
          SimulationService.name,
          perceptionType,
          perceptionPayload,
          `agent.${targetAgentId}.perception`,
        );
        this.eventBus.publish(perceptionEvent);
      });
    } else {
      this.logger.warn(`No perception generated for simulation event: ${event.type}`);
    }
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
