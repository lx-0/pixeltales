import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DomainEvent, Metric } from '@pixeltales/contracts';
import { EVENT_BUS, IEventBus, ISubscription } from '../event-bus.interface';
import { IMetricsAdapter, METRICS_ADAPTER } from './adapters/metrics.adapter.interface';
import { IMetricFormatter, METRIC_FORMATTER } from './formatters/metric.formatter.interface';

@Injectable()
export class StatsCollectorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StatsCollectorService.name);
  private subscriptions: ISubscription[] = [];
  private metricBuffer: Metric[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 50; // Configurable: How many metrics trigger a flush
  private readonly BATCH_INTERVAL_MS = 5000; // Configurable: Flush every 5 seconds
  private isFlushing = false; // Define the flushing flag property

  constructor(
    @Inject(EVENT_BUS) private readonly eventBus: IEventBus,
    @Inject(METRIC_FORMATTER) private readonly formatter: IMetricFormatter,
    @Inject(METRICS_ADAPTER) private readonly adapters: IMetricsAdapter[],
  ) {
    if (!this.adapters || this.adapters.length === 0) {
      this.logger.warn('No metrics adapters provided to StatsCollectorService!');
    }
  }

  onModuleInit() {
    this.logger.log('Initializing StatsCollectorService subscriptions and batching...');

    // List of event types to subscribe to for metrics
    const metricEventTypes: DomainEvent['type'][] = [
      'agent.state.dynamic.updated',
      'agent.cognitive.cycle.phase_completed',
      'simulation.agent.speak',
      'simulation.agent.move',
      'learning.reward.recorded',
      // Add other event types here as needed
    ];

    metricEventTypes.forEach((eventType) => {
      try {
        const sub = this.eventBus.subscribe(eventType, this.handleEvent.bind(this));
        this.subscriptions.push(sub);
        this.logger.log(`Subscribed to '${eventType}' events.`);
      } catch (error) {
        this.logger.error(`Failed to subscribe to event type ${eventType}`, error);
      }
    });

    // Initialize batching timer
    this.batchTimer = setInterval(() => {
      if (this.metricBuffer.length > 0) {
        this.logger.log(
          `Flushing metric buffer due to interval (${this.metricBuffer.length} metrics)`,
        );
        this.flushBuffer();
      }
    }, this.BATCH_INTERVAL_MS);
  }

  /**
   * Generic handler for all subscribed metric-worthy events.
   */
  private async handleEvent(event: DomainEvent): Promise<void> {
    this.logger.debug(`Handling event type: ${event.type}`);
    try {
      const metrics = this.formatter.formatEvent(event);

      if (metrics && metrics.length > 0) {
        this.logger.verbose(`Formatted ${metrics.length} metric(s) from event ${event.type}`);
        this.addMetricsToBuffer(metrics);
      } else {
        this.logger.debug(`Formatter returned no metrics for event type ${event.type}.`);
      }
    } catch (error) {
      this.logger.error(`Error processing event type ${event.type}`, error);
    }
  }

  /**
   * Adds metrics to the buffer and triggers flush if size threshold is reached.
   */
  private addMetricsToBuffer(metrics: Metric[]): void {
    this.metricBuffer.push(...metrics);
    this.logger.verbose(
      `Added ${metrics.length} metrics to buffer (current size: ${this.metricBuffer.length})`,
    );

    if (this.metricBuffer.length >= this.BATCH_SIZE) {
      this.logger.log(
        `Flushing metric buffer due to size limit (${this.metricBuffer.length} >= ${this.BATCH_SIZE})`,
      );
      // Use setTimeout to avoid blocking the event handler. Ignore promise from async flushBuffer.
      setTimeout(() => {
        void this.flushBuffer();
      }, 0);
    }
  }

  /**
   * Flushes the metric buffer by sending batches to adapters.
   */
  private async flushBuffer(): Promise<void> {
    // Prevent concurrent flushes using the class property
    if (this.isFlushing) {
      this.logger.warn('Flush already in progress, skipping.');
      return;
    }

    // Grab current buffer and clear it immediately
    const metricsToFlush = [...this.metricBuffer];
    this.metricBuffer = [];

    if (metricsToFlush.length === 0) {
      return; // Nothing to flush
    }

    this.logger.log(`Flushing ${metricsToFlush.length} metrics to adapters...`);
    this.isFlushing = true; // Set the flag

    try {
      await Promise.allSettled(
        this.adapters.map(async (adapter) => {
          try {
            if (adapter.batchInsert) {
              await adapter.batchInsert(metricsToFlush);
            } else {
              // Fallback if adapter doesn't implement batchInsert
              this.logger.warn(
                `Adapter ${adapter.constructor.name} does not implement batchInsert, falling back to writePoint per metric.`,
              );
              for (const metric of metricsToFlush) {
                await adapter.writePoint(metric);
              }
            }
          } catch (adapterError) {
            // Log error specific to this adapter
            this.logger.error(
              `Adapter ${adapter.constructor.name} failed during batch insert`,
              adapterError,
            );
            // Don't rethrow, let other adapters proceed
          }
        }),
      );
      this.logger.debug(`Finished flushing ${metricsToFlush.length} metrics.`);
    } catch (error) {
      // Catch potential errors from Promise.allSettled itself (unlikely)
      this.logger.error('Unexpected error during flushBuffer Promise.allSettled', error);
    } finally {
      this.isFlushing = false; // Reset the flag
    }
  }

  async onModuleDestroy() {
    this.logger.log('Cleaning up StatsCollectorService...');

    // Clear interval timer
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }

    // Unsubscribe from events
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];

    // Ensure any remaining metrics in the buffer are flushed
    if (this.metricBuffer.length > 0) {
      this.logger.log(`Flushing remaining ${this.metricBuffer.length} metrics on destroy.`);
      await this.flushBuffer();
    }

    this.logger.log('StatsCollectorService cleanup complete.');
  }
}
