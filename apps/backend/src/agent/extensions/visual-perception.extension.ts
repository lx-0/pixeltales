import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  AgentMovedPayload, // Import specific payload type
  AgentMovedSimulationState,
} from '@pixeltales/contracts';
import { AgentService } from '../../agent/agent.service';
import { EVENT_BUS, IEventBus } from '../../core/event-bus.interface';
import { EventBusService } from '../../core/event-bus.service';
import { IPerceptionExtension } from './perception.extension.interface';

// Temporary placeholders
type VisualData = any; // Define based on simulation output (e.g., scene graph, object list)

// Placeholder type for position
type AgentPosition = { x: number; y: number };

@Injectable()
export class VisualPerceptionExtension implements IPerceptionExtension, OnModuleInit {
  private readonly logger = new Logger(VisualPerceptionExtension.name);
  readonly perceptionType = 'visual';

  // Placeholder for agent positions/visibility state
  private agentPositions = new Map<string, AgentPosition>();
  private readonly VISUAL_RANGE_SQUARED = 100 * 100; // Example visual range

  constructor(
    @Inject(EVENT_BUS) private readonly eventBus: IEventBus,
    private readonly agentService: AgentService, // To get agent list/positions
  ) {}

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

    // Update internal state
    this.agentPositions.set(movedAgentId, newPosition);
    this.logger.debug(
      `Processing raw move event for ${movedAgentId} to (${newPosition.x}, ${newPosition.y})`,
    );

    const activeAgents = this.agentService.listActiveAgents();
    const potentialViewers = activeAgents.filter((id) => id !== movedAgentId);

    for (const viewerAgentId of potentialViewers) {
      const viewerPosition = this.agentPositions.get(viewerAgentId) ?? { x: -1000, y: -1000 };

      // Simple distance check for visibility (placeholder)
      const dx = newPosition.x - viewerPosition.x;
      const dy = newPosition.y - viewerPosition.y;
      const distSq = dx * dx + dy * dy;

      if (distSq <= this.VISUAL_RANGE_SQUARED) {
        this.logger.verbose(`Agent ${viewerAgentId} is within visual range of ${movedAgentId}`);
        // Construct the specific perception payload
        const perceptionPayload: AgentMovedPayload = {
          sourceVisualId: movedAgentId, // Agent causing the perception (the one who moved)
          visualId: movedAgentId, // Agent who actually moved
          newPosition: newPosition,
          metadata: event.payload.metadata, // Pass original metadata
        };
        // Generate the targeted perception event
        const perceptionEvent = EventBusService.createEvent(
          this.constructor.name,
          'perception.agent_moved',
          perceptionPayload,
          `agent.${viewerAgentId}.perception`,
        );
        this.eventBus.publish(perceptionEvent);
      }
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
