import { Injectable, Logger } from '@nestjs/common';
import { DomainEvent, uuid } from '@pixeltales/contracts';
import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
// Use the new DomainEvent structure and IEventBus interface
import { EventHandler, IEventBus, ISubscription } from './event-bus.interface';

@Injectable()
export class EventBusService implements IEventBus {
  private readonly logger = new Logger(EventBusService.name);
  private eventSubject = new Subject<DomainEvent>();
  private history: DomainEvent[] = [];
  private readonly historyLimit = 100; // Keep last 100 events
  private subscriptions = new Map<
    string,
    Map<number, { handler: EventHandler<any>; filter?: (event: any) => boolean }>
  >();
  private subIdCounter = 0;

  constructor() {
    this.logger.log('EventBusService Initialized');
    // Subscribe to own stream for history
    this.eventSubject.subscribe((event) => this.addToHistory(event));
  }

  private addToHistory(event: DomainEvent): void {
    this.history.push(event);
    if (this.history.length > this.historyLimit) {
      this.history.shift(); // Remove oldest event
    }
  }

  static createEvent<U extends DomainEvent, T extends U['type']>(
    source: string,
    type: T,
    payload: U['payload'],
    topic?: string,
  ): Extract<U, { type: T }> {
    const base = {
      id: uuid(),
      type,
      timestamp: Date.now(),
      source,
      ...(topic && { topic }),
      payload,
    } as Extract<U, { type: T }>;
    return base;
  }

  publish(event: DomainEvent): void {
    // Add base fields if missing (should ideally be done by emitter)
    if (!event.id) event.id = uuid();
    if (!event.timestamp) event.timestamp = Date.now();
    if (!event.source) {
      this.logger.warn(`Event published without source: ${event.type}`);
      event.source = 'UnknownSource';
    }

    this.logger.debug(`Publishing event: ${event.type} from ${event.source}`);
    this.eventSubject.next(event); // Publish the full event
    this.addToHistory(event); // Add to history here after base fields are added
  }

  subscribe<E extends DomainEvent>(
    eventType: E['type'],
    handler: EventHandler<E>,
    options?: { filter?: (event: E) => boolean },
  ): ISubscription {
    const subscriptionId = ++this.subIdCounter;
    const eventTypeKey = eventType; // Use literal type string as key

    if (!this.subscriptions.has(eventTypeKey)) {
      this.subscriptions.set(eventTypeKey, new Map());
    }

    const subMap = this.subscriptions.get(eventTypeKey)!;
    subMap.set(subscriptionId, { handler, filter: options?.filter });

    this.logger.log(`Subscribed [ID: ${subscriptionId}] to event type: ${eventTypeKey}`);

    // Listen to the main subject, filter by type, then apply custom filter
    const internalSubscription = this.eventSubject
      .pipe(
        filter((event): event is E => event.type === eventType),
        filter((event) => (options?.filter ? options.filter(event) : true)),
      )
      .subscribe({
        next: (event) => {
          try {
            const result = handler(event);
            if (result instanceof Promise) {
              result.catch((error) =>
                this.logger.error(
                  `Async handler error for event ${event.type} [SubID: ${subscriptionId}]`,
                  error,
                ),
              );
            }
          } catch (error) {
            this.logger.error(
              `Sync handler error for event ${event.type} [SubID: ${subscriptionId}]`,
              error,
            );
          }
        },
        error: (err) => this.logger.error('Error in event bus stream', err),
      });

    // Return an object allowing unsubscribe
    return {
      unsubscribe: () => {
        internalSubscription.unsubscribe();
        subMap.delete(subscriptionId);
        if (subMap.size === 0) {
          this.subscriptions.delete(eventTypeKey);
        }
        this.logger.log(`Unsubscribed [ID: ${subscriptionId}] from event type: ${eventTypeKey}`);
      },
    };
  }

  observe<E extends DomainEvent>(eventType: E['type']): Observable<E> {
    return this.eventSubject.pipe(filter((event): event is E => event.type === eventType));
  }

  getEventHistory(eventTypePattern?: string, limit?: number): DomainEvent[] {
    const effectiveLimit = limit ?? this.historyLimit;
    let filteredHistory = this.history;

    if (eventTypePattern) {
      // Basic wildcard matching for now
      if (eventTypePattern.endsWith('.*')) {
        const prefix = eventTypePattern.slice(0, -2);
        filteredHistory = this.history.filter((event) => event.type.startsWith(prefix));
      } else {
        filteredHistory = this.history.filter((event) => event.type === eventTypePattern);
      }
    }

    return filteredHistory.slice(-effectiveLimit);
  }
}
