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
  private eventQueue = new Map<string, AgentPerceptionEvent[]>(); // agentId -> queue

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
   * Handles events emitted by Capability Extensions, potentially generating perceptions for others.
   * Now uses strictly typed event parameter.
   */
  private handleAgentAction(event: SimulationAgentActionEvent): void {
    // No need to cast 'event' anymore, TS knows its type based on subscription
    const actingAgentId = event.payload.agentId;
    if (!actingAgentId) {
      this.logger.error(`Simulation event missing agentId: ${event.type}`);
      return;
    }
    this.logger.debug(`Simulation received action event: ${event.type} from ${actingAgentId}`);

    const activeAgentIds = this.agentService.listActiveAgents();
    const perceivingAgentIds = activeAgentIds.filter((id) => id !== actingAgentId);
    if (perceivingAgentIds.length === 0) return;

    let perception: AgentPerceptionEvent | null = null;

    // Switch on the event type (now strictly typed)
    switch (event.type) {
      case 'simulation.agent.speak': {
        const payload = event.payload;
        // Use EventBusService.createEvent
        perception = EventBusService.createEvent(
          'SimulationService', // source
          'perception.message', // type
          {
            // payload object
            sourceVisualId: actingAgentId,
            content: payload.content ?? '',
            metadata: { tone: payload.tone },
          },
          // No topic needed here, set later
        );
        break;
      }
      case 'simulation.agent.move': {
        const payload = event.payload;
        // Use EventBusService.createEvent
        perception = EventBusService.createEvent(
          'SimulationService', // source
          'perception.agent_moved', // type
          {
            // payload object
            sourceVisualId: actingAgentId,
            visualId: actingAgentId,
            newPosition: { x: Math.random() * 100, y: Math.random() * 100 },
            metadata: { target: payload.target },
          },
          // No topic needed here, set later
        );
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

    if (perception) {
      perceivingAgentIds.forEach((id) => {
        // Set agent-specific topic before queuing
        const agentSpecificPerception = { ...perception, topic: `agent.${id}.perception` };
        this.queuePerception(id, agentSpecificPerception);
      });
    }
  }

  /**
   * Queues a perception for a specific agent.
   */
  private queuePerception(agentId: string, perception: AgentPerceptionEvent): void {
    if (!this.eventQueue.has(agentId)) {
      this.eventQueue.set(agentId, []);
    }
    this.eventQueue.get(agentId)?.push(perception);
    this.logger.verbose(`Queued perception [${perception.type}] for agent ${agentId}`);
  }

  /**
   * Gets the next perception event for an agent (mock implementation).
   */
  async getNextPerception(agentId: string): Promise<AgentPerceptionEvent | null> {
    // Simple mock: return queued event, or generate a periodic tick/dummy event
    const queue = this.eventQueue.get(agentId);
    if (queue && queue.length > 0) {
      const perception = queue.shift(); // Get first event
      this.logger.debug(`[${agentId}] Dequeuing perception: ${perception?.type}`);
      return perception ?? null;
    }

    // If queue is empty, maybe return a generic 'tick' or 'idle' perception?
    // Or just null to indicate nothing new happened.
    // Let's return null for now to avoid infinite mock loops without external input.
    // To test loop: return { type: 'scene_update', description: 'Time passes...', timestamp: Date.now() };
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
