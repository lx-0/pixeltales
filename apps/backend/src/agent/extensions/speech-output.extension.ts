import { Inject, Injectable, Logger } from '@nestjs/common';
import { AgentSpeakEventPayload } from '@pixeltales/contracts';
import { EVENT_BUS, IEventBus } from '../../core/event-bus.interface';
import { EventBusService } from '../../core/event-bus.service';
import { CapabilityExecutionResult, ICapabilityExtension } from './capability.extension.interface';

/**
 * Handles 'speak' actions.
 * In a real implementation, this would interface with TTS or send events to the frontend simulation.
 */
@Injectable()
export class SpeechOutputExtension implements ICapabilityExtension {
  private readonly logger = new Logger(SpeechOutputExtension.name);
  readonly capabilityName = 'speak';

  // Inject EventBus
  constructor(@Inject(EVENT_BUS) private readonly eventBus: IEventBus) {}

  async execute(
    agentId: string,
    payload: AgentSpeakEventPayload,
  ): Promise<CapabilityExecutionResult> {
    try {
      this.logger.log(
        `[${agentId}] Executing ${this.capabilityName}: "${payload.content.substring(0, 50)}..."`,
      );

      // Use EventBusService.createEvent
      const simulationEvent = EventBusService.createEvent(
        'SpeechOutputExtension', // source
        'simulation.agent.speak', // type
        {
          // payload object
          agentId: agentId,
          content: payload.content,
          tone: payload.tone,
          targetAudience: payload.targetAudience,
          metadata: payload.metadata,
        },
        // No topic needed
      );

      // Publish the full event object
      this.eventBus.publish(simulationEvent);

      // Simulate time taken for speech (optional)
      // const speakDuration = (speakPayload.content.length / 15) * 1000; // Basic estimate
      // await new Promise((resolve) => setTimeout(resolve, speakDuration));

      return { success: true, message: 'Speak event emitted.' };
    } catch (error) {
      this.logger.error(`[${agentId}] Error executing speak action`, error);
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}
