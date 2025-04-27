import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MessageBroadcastPayload, SpeechOccurredSimulationEvent } from '@pixeltales/contracts';
import { EVENT_BUS, IEventBus } from '../../core/event-bus.interface';
import { EventBusService } from '../../core/event-bus.service';
import { IPerceptionExtension } from './perception.extension.interface';

/**
 * Processes raw auditory simulation events (like speech) and generates
 * perception events for agents within hearing range.
 */
@Injectable()
export class AuditoryPerceptionExtension implements IPerceptionExtension, OnModuleInit {
  private readonly logger = new Logger(AuditoryPerceptionExtension.name);
  readonly perceptionType = 'auditory';

  constructor(@Inject(EVENT_BUS) private readonly eventBus: IEventBus) {}

  onModuleInit() {
    this.logger.log(
      `Initializing ${this.constructor.name}, subscribing to raw simulation events...`,
    );
    // Subscribe only to relevant simulation events
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

    // Get potential listeners AND their context from the event payload
    const perceiverContextList = event.payload.perceiverContextList ?? [];

    if (perceiverContextList.length === 0) {
      return; // Nothing to do if no potential listeners
    }

    // Process each potential listener provided by the simulation
    for (const context of perceiverContextList) {
      const listenerAgentId = context.perceiverAgentId;
      const distance = context.distance;

      this.logger.verbose(
        `Agent ${listenerAgentId} can potentially hear ${speakerAgentId} (Distance: ${distance?.toFixed(1) ?? 'N/A'})`,
      );

      // Construct the specific perception payload
      const perceptionPayload: MessageBroadcastPayload = {
        sourceVisualId: speakerAgentId,
        content: speechContent,
        metadata: { tone: speechTone, distance: distance },
      };

      // Generate the targeted perception event
      const perceptionEvent = EventBusService.createEvent(
        this.constructor.name,
        'perception.message',
        perceptionPayload,
        `agent.${listenerAgentId}.perception`,
      );
      this.eventBus.publish(perceptionEvent);
    }
  }

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
