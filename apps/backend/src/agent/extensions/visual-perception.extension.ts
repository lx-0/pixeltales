import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AgentMovedPayload, AgentMovedSimulationState } from '@pixeltales/contracts';
import { EVENT_BUS, IEventBus } from '../../core/event-bus.interface';
import { EventBusService } from '../../core/event-bus.service';
import { IPerceptionExtension } from './perception.extension.interface';

@Injectable()
export class VisualPerceptionExtension implements IPerceptionExtension, OnModuleInit {
  private readonly logger = new Logger(VisualPerceptionExtension.name);
  readonly perceptionType = 'visual';

  constructor(@Inject(EVENT_BUS) private readonly eventBus: IEventBus) {}

  onModuleInit() {
    this.logger.log(
      `Initializing ${this.constructor.name}, subscribing to raw simulation events...`,
    );
    this.eventBus.subscribe('simulation.state.agent_moved', (event: AgentMovedSimulationState) => {
      this.handleRawMoveEvent(event).catch((err) => {
        this.logger.error('Error handling raw move event:', err);
      });
    });
    // TODO: Subscribe to other visual events (object changes, agent appearances?)
  }

  private async handleRawMoveEvent(event: AgentMovedSimulationState): Promise<void> {
    if (event.type !== 'simulation.state.agent_moved') return; // Type guard

    const movedAgentId = event.payload.agentId;
    const newPosition = event.payload.newPosition;

    // Get potential viewers FROM THE EVENT PAYLOAD
    const perceiverContextList = event.payload.perceiverContextList ?? [];

    if (perceiverContextList.length === 0) {
      this.logger.verbose('No potential viewers provided in move event payload.');
      return; // Nothing to do if no potential viewers
    }

    // Process each potential viewer provided by the simulation
    for (const context of perceiverContextList) {
      const viewerAgentId = context.perceiverAgentId;
      const distance = context.distance; // Available if needed

      // Skip if viewer is the one who moved (shouldn't happen if sim excludes)
      if (viewerAgentId === movedAgentId) continue;

      this.logger.verbose(
        `Agent ${viewerAgentId} can potentially see ${movedAgentId} (Distance: ${distance?.toFixed(1) ?? 'N/A'})`,
      );

      // Construct the specific perception payload
      const perceptionPayload: AgentMovedPayload = {
        sourceVisualId: movedAgentId, // Agent causing the perception (the one who moved)
        visualId: movedAgentId, // Agent who actually moved
        newPosition: newPosition,
        // Pass original metadata + distance from context
        metadata: { ...(event.payload.metadata ?? {}), distance: distance },
      };

      // Generate the targeted perception event
      const perceptionEvent = EventBusService.createEvent(
        this.constructor.name,
        'perception.agent_moved', // Correct perception event type
        perceptionPayload,
        `agent.${viewerAgentId}.perception`, // Topic for targeted delivery
      );
      this.eventBus.publish(perceptionEvent);
    }
  }

  /**
   * @deprecated Prefer event-driven processing
   */
  async processSensoryStream(agentId: string, data: unknown): Promise<void> {
    this.logger.warn(
      `processSensoryStream called directly on ${this.constructor.name} for agent ${agentId}. Event-driven processing is preferred.`,
    );
    await Promise.resolve();
  }
}
