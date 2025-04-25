import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  // Import specific learning event types this service might handle
  ExperimentResultRecordedEvent,
  LearningNotification,
  LearningRewardRecordedEvent,
} from '@pixeltales/contracts';
import { EVENT_BUS, IEventBus } from '../event-bus.interface';
import { EventBusService } from '../event-bus.service'; // Use this for createEvent

// Define the union of event types that trigger learning notifications
type HandledLearningEvent = ExperimentResultRecordedEvent | LearningRewardRecordedEvent; // Add others as needed

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name); // Instantiate Logger

  constructor(@Inject(EVENT_BUS) private readonly eventBus: IEventBus) {
    // Example subscription to specific learning events
    this.eventBus.subscribe(
      'learning.discovery.experiment_result',
      this.handleLearningEvent.bind(this),
    );
    this.eventBus.subscribe('learning.reward.recorded', this.handleLearningEvent.bind(this));
  }

  /**
   * Handles a relevant learning event and formats/dispatches a notification.
   */
  async handleLearningEvent(event: HandledLearningEvent): Promise<void> {
    this.logger.debug(`Handling learning event: ${event.type} for agent ${event.payload.agentId}`);

    // Format the core notification content
    const notificationContent = this.formatLearningNotificationContent(event);

    // Dispatch the notification using the formatted content
    this.dispatchNotificationEvent(notificationContent, event.id); // Pass original event ID for linking
  }

  // Renamed to reflect it only formats the CONTENT, not the full event object
  private formatLearningNotificationContent(
    event: HandledLearningEvent,
  ): Omit<LearningNotification, 'id' | 'timestamp'> {
    // Return type excludes base fields
    const agentId = event.payload.agentId;
    let description = 'Learned something new!';
    let xpValue = 10;
    let skillCategory = 'General Knowledge';
    let type: LearningNotification['type'] = 'world_discovery';

    if (event.type === 'learning.discovery.experiment_result') {
      type = 'conceptual_framework';
      description = `Concluded an experiment regarding ${event.payload.result?.hypothesisId ?? 'a hypothesis'}`;
      xpValue = 25;
      skillCategory = 'Exploration';
    } else if (event.type === 'learning.reward.recorded') {
      type = 'skill_acquisition';
      description = `Received a reward of ${event.payload.rewardScore}.`;
      xpValue = Math.round(event.payload.rewardScore * 5);
      skillCategory = 'Reinforcement';
    }

    const formattedContent = {
      // No ID or Timestamp here!
      agentId: agentId,
      type: type,
      description: description,
      xpValue: xpValue,
      skillCategory: skillCategory,
      relatedEvidenceIds: [event.id], // Keep link to original event
    };
    this.logger.verbose({ message: 'Formatted notification content', content: formattedContent });
    return formattedContent;
  }

  // Modified to accept content and original event ID
  private dispatchNotificationEvent(
    notificationContent: Omit<LearningNotification, 'id' | 'timestamp'>,
    originalEventId?: string, // Keep track of this if needed elsewhere
  ): void {
    this.logger.log(`Dispatching notification event for agent ${notificationContent.agentId}`);

    // Use EventBusService.createEvent for the system dispatch event
    const dispatchEvent = EventBusService.createEvent(
      'NotificationService',
      'system.notification.dispatched',
      {
        // Payload for the dispatch event
        notificationType: notificationContent.type,
        recipientAgentId: notificationContent.agentId,
        title: notificationContent.skillCategory,
        message: notificationContent.description,
        data: { ...notificationContent, originalEventId }, // Include original ID in data if needed
      },
      undefined, // No topic
    );

    this.eventBus.publish(dispatchEvent);
  }

  // Optional: Add methods for other notification types (system alerts, etc.)
}
