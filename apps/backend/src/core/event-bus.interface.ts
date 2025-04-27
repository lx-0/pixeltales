import { DomainEvent } from '@pixeltales/contracts';
import { Observable } from 'rxjs';

// Interface for event subscription management
export interface ISubscription {
  unsubscribe(): void;
}

// Define a generic handler type that receives the specific event type
export type EventHandler<T extends DomainEvent> = (event: T) => void | Promise<void>;

/**
 * Defines the core interface for the Event Bus service.
 * Based on section 3.1.2 and 4.6.2.
 * Uses strictly typed discriminated unions for events.
 */
export interface IEventBus {
  /**
   * Publishes a strictly typed event object.
   * @param event The full event object conforming to DomainEvent or a more specific union.
   */
  publish(event: DomainEvent): void; // Publish the whole event object

  /**
   * Subscribes a handler to specific event types.
   * The handler receives the correctly typed event object.
   * @param eventType The literal event type string to subscribe to (e.g., 'simulation.agent.speak').
   * @param handler The function to call with the specific event type.
   * @param options Optional filtering criteria (might filter on event properties).
   * @returns A subscription object to manage the subscription.
   */
  subscribe<T extends DomainEvent['type']>( // Keep generic for handler type
    eventType: T, // Use the full union type directly here
    handler: EventHandler<Extract<DomainEvent, { type: T }>>,
    options?: { filter?: (event: Extract<DomainEvent, { type: T }>) => boolean }, // Filter still uses generic E
  ): ISubscription;

  /**
   * Returns an Observable stream of strictly typed events matching the type.
   * @param eventType The literal event type string to observe.
   * @returns An RxJS Observable emitting matching, typed events.
   */
  observe<T extends DomainEvent['type']>(
    eventType: T,
  ): Observable<Extract<DomainEvent, { type: T }>>; // Use the full union type here too

  /**
   * Retrieves a history of recent events.
   * Returns the generic DomainEvent type for simplicity, casting might be needed.
   */
  getEventHistory(eventTypePattern?: string, limit?: number): DomainEvent[];
}

// Define injection token if using NestJS dependency injection
export const EVENT_BUS = Symbol('IEventBus');
