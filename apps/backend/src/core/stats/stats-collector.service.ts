import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import {
  AgentDynamicStateUpdatedEvent,
  CognitiveCyclePhaseCompletedEvent,
  Metric,
} from '@pixeltales/contracts';
import { EVENT_BUS, IEventBus, ISubscription } from '../event-bus.interface';
import { IMetricsAdapter, METRICS_ADAPTER } from './adapters/metrics.adapter.interface';
import { IMetricFormatter, METRIC_FORMATTER } from './formatters/metric.formatter.interface';

@Injectable()
export class StatsCollectorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StatsCollectorService.name);
  private subscriptions: ISubscription[] = [];

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
    this.logger.log('Initializing StatsCollectorService subscriptions...');
    // --- Subscribe to Dynamic State Updates --- //
    const dynamicStateSub = this.eventBus.subscribe<AgentDynamicStateUpdatedEvent>(
      'agent.state.dynamic.updated', // The specific event type string
      this.handleDynamicStateUpdate.bind(this),
    );
    this.subscriptions.push(dynamicStateSub);
    this.logger.log("Subscribed to 'agent.state.dynamic.updated' events.");

    // --- Subscribe to Cognitive Cycle Phase Completion --- //
    const stepTimingSub = this.eventBus.subscribe<CognitiveCyclePhaseCompletedEvent>(
      'agent.cognitive.cycle.phase_completed',
      this.handleStepTiming.bind(this),
    );
    this.subscriptions.push(stepTimingSub);
    this.logger.log("Subscribed to 'agent.cognitive.cycle.phase_completed' events.");

    // --- Subscribe to other relevant events --- //
    // Example: Subscribe to agent actions
    // const actionSub = this.eventBus.subscribe('simulation.agent.speak', this.handleAgentAction.bind(this));
    // this.subscriptions.push(actionSub);

    // Add subscriptions for other events like step timing, rewards etc.
  }

  /**
   * Handles the 'agent.state.dynamic.updated' event.
   * Formats it into a metric and persists it using adapters.
   */
  private async handleDynamicStateUpdate(event: AgentDynamicStateUpdatedEvent): Promise<void> {
    this.logger.debug(`Handling dynamic state update for agent ${event.payload.agentId}`);
    try {
      const metric = this.formatter.formatDynamicStateUpdateMetric(event);

      if (metric) {
        this.logger.verbose(`Formatted dynamic state metric: ${JSON.stringify(metric)}`);
        await this.persistMetric(metric);
      } else {
        this.logger.debug('Formatter returned null for dynamic state update event.');
      }
    } catch (error) {
      this.logger.error(
        `Error processing dynamic state update event for agent ${event.payload.agentId}`,
        error,
      );
    }
  }

  /**
   * Handles the 'agent.cognitive.cycle.phase_completed' event.
   */
  private async handleStepTiming(event: CognitiveCyclePhaseCompletedEvent): Promise<void> {
    this.logger.debug(
      `Handling step timing for agent ${event.payload.agentId}, phase ${event.payload.phase}`,
    );
    try {
      const metric = this.formatter.formatStepTimingMetric(event);
      if (metric) {
        await this.persistMetric(metric);
      } else {
        this.logger.debug('Formatter returned null for step timing event.');
      }
    } catch (error) {
      this.logger.error(
        `Error processing step timing event for agent ${event.payload.agentId}`,
        error,
      );
    }
  }

  // Generic helper to persist a metric using all adapters
  private async persistMetric(metric: Metric): Promise<void> {
    this.logger.verbose(`Persisting metric: ${JSON.stringify(metric)}`);
    try {
      await Promise.all(this.adapters.map((adapter) => adapter.writePoint(metric)));
      this.logger.debug(`Persisted metric via ${this.adapters.length} adapters.`);
    } catch (error) {
      this.logger.error(`Failed to persist metric via adapters`, error);
    }
  }

  // Add other handlers like handleAgentAction, handleStepTiming etc.
  // private async handleAgentAction(event: DomainEvent): Promise<void> { ... }

  // Ensure subscriptions are cleaned up on destroy
  async onModuleDestroy() {
    this.logger.log('Cleaning up StatsCollectorService subscriptions...');
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];
  }
}
