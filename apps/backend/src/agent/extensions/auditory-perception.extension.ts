import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MessageBroadcastPayload, SpeechOccurredSimulationEvent } from '@pixeltales/contracts';
import { AgentService } from '../../agent/agent.service'; // Need agent service for positions
import { EVENT_BUS, IEventBus } from '../../core/event-bus.interface';
import { EventBusService } from '../../core/event-bus.service';
import { IPerceptionExtension } from './perception.extension.interface';

// Temporary placeholders
type AudioData = {
  transcription: string;
  sourceVisualId: string;
};

type AgentPosition = { x: number; y: number }; // Simple position type

/**
 * Processes raw auditory simulation events (like speech) and generates
 * perception events for agents within hearing range.
 */
@Injectable()
export class AuditoryPerceptionExtension implements IPerceptionExtension, OnModuleInit {
  private readonly logger = new Logger(AuditoryPerceptionExtension.name);
  readonly perceptionType = 'auditory';

  // Placeholder for agent positions - In a real sim, this might query SimulationService or SceneState
  private agentPositions = new Map<string, AgentPosition>(); // AgentId -> Position
  private readonly HEARING_RANGE_SQUARED = 50 * 50; // Example hearing range (squared for efficiency)

  constructor(
    @Inject(EVENT_BUS) private readonly eventBus: IEventBus,
    // Inject AgentService to get list of active agents and their positions
    // Note: This creates a potential dependency cycle if AgentService depends heavily on extensions.
    // Consider a dedicated SceneState service later.
    private readonly agentService: AgentService,
  ) {}

  onModuleInit() {
    this.logger.log(
      `Initializing ${this.constructor.name}, subscribing to raw simulation events...`,
    );
    // Subscribe specifically to the raw speech event
    this.eventBus.subscribe(
      'simulation.event.speech_occurred',
      (event: SpeechOccurredSimulationEvent) => {
        this.handleRawSpeechEvent(event).catch((err) => {
          this.logger.error('Error handling raw speech event:', err);
        });
      },
    );
  }

  private async handleRawSpeechEvent(event: SpeechOccurredSimulationEvent): Promise<void> {
    // Explicit type check to satisfy linter/compiler
    if (event.type !== 'simulation.event.speech_occurred') {
      this.logger.error(`Received incorrect event type: ${event.type as string}`);
      return;
    }

    const speakerAgentId = event.payload.agentId;
    const speechContent = event.payload.content;
    const speechTone = event.payload.tone;
    const speakerPosition = event.payload.position ??
      this.agentPositions.get(speakerAgentId) ?? { x: -1000, y: -1000 };

    this.logger.debug(
      `Processing raw speech event from ${speakerAgentId} at (${speakerPosition.x}, ${speakerPosition.y})`,
    );

    // Update known position (simple placeholder)
    if (event.payload.position) {
      this.agentPositions.set(speakerAgentId, event.payload.position);
    }

    const activeAgents = this.agentService.listActiveAgents();
    const potentialListeners = activeAgents.filter((id) => id !== speakerAgentId);

    for (const listenerAgentId of potentialListeners) {
      const listenerPosition = this.agentPositions.get(listenerAgentId) ?? { x: -1000, y: -1000 }; // Get listener pos

      // Simple distance check
      const dx = speakerPosition.x - listenerPosition.x;
      const dy = speakerPosition.y - listenerPosition.y;
      const distSq = dx * dx + dy * dy;

      if (distSq <= this.HEARING_RANGE_SQUARED) {
        this.logger.verbose(
          `Agent ${listenerAgentId} is within hearing range of ${speakerAgentId}`,
        );
        // Construct the specific payload type
        const perceptionPayload: MessageBroadcastPayload = {
          sourceVisualId: speakerAgentId,
          content: speechContent,
          metadata: { tone: speechTone, distance: Math.sqrt(distSq) },
        };
        // Generate the targeted perception event using the correct payload
        const perceptionEvent = EventBusService.createEvent(
          this.constructor.name,
          'perception.message',
          perceptionPayload, // Use the correctly typed payload
          `agent.${listenerAgentId}.perception`,
        );
        this.eventBus.publish(perceptionEvent);
      }
    }
  }

  // Implement processSensoryStream to satisfy interface, but mark as deprecated/not primary path
  /**
   * @deprecated Prefer event-driven processing via handleRawSpeechEvent
   */
  async processSensoryStream(agentId: string, data: unknown): Promise<void> {
    this.logger.warn(
      `processSensoryStream called directly on ${this.constructor.name} for agent ${agentId}. Event-driven processing is preferred.`,
    );
    await Promise.resolve();
  }
}
