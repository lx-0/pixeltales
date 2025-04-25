import {
  AgentDynamicStateUpdatedEvent,
  CognitiveCyclePhaseCompletedEvent,
  DomainEvent,
  LearningRewardRecordedEvent,
  Metric,
  SimulationAgentActionEvent,
} from '@pixeltales/contracts';

/**
 * Interface for formatters that convert raw event payloads into standardized Metric objects.
 */
export interface IMetricFormatter {
  /**
   * Formats a generic event into one or more Metric objects.
   * Can return multiple metrics if a single event maps to several measurements.
   * @param event The raw event object from the EventBus.
   * @returns An array of formatted Metric objects, or an empty array if the event is not metric-worthy.
   */
  formatEvent(event: DomainEvent): Metric[];

  formatAgentActionMetric(event: SimulationAgentActionEvent): Metric | null;
  formatStepTimingMetric(event: CognitiveCyclePhaseCompletedEvent): Metric | null;
  // formatMemoryMetric(event: DomainEventTBD): Metric | null;
  formatRewardMetric(event: LearningRewardRecordedEvent): Metric | null;
  formatDynamicStateUpdateMetric(event: AgentDynamicStateUpdatedEvent): Metric | null;

  // Potential future specific formatters if needed:
  // formatAgentMetric?(event: AgentActionEvent): Metric;
  // formatSystemMetric?(event: SystemEvent): Metric;
}

/**
 * Injection token for the metric formatter interface.
 */
export const METRIC_FORMATTER = 'METRIC_FORMATTER';
