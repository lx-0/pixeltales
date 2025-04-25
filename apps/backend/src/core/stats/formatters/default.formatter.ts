import { Injectable, Logger } from '@nestjs/common';
import {
  AgentDynamicStateUpdatedEvent,
  CognitiveCyclePhaseCompletedEvent,
  DomainEvent,
  LearningRewardRecordedEvent,
  Metric,
  SimulationAgentActionEvent,
} from '@pixeltales/contracts';
import { IMetricFormatter } from './metric.formatter.interface';

@Injectable()
export class DefaultMetricFormatter implements IMetricFormatter {
  private readonly logger = new Logger(DefaultMetricFormatter.name);

  /**
   * Default formatter: Returns an empty array, indicating no specific metric generated.
   * Specific formatters should be used for detailed metric creation.
   */
  formatEvent(event: DomainEvent): Metric[] {
    const metric = this.formatSingleEvent(event);
    return metric ? [metric] : [];
  }

  formatSingleEvent(event: DomainEvent): Metric | null {
    switch (event.type) {
      // --- Simulation Agent Actions ---
      case 'simulation.agent.speak':
      case 'simulation.agent.move':
        // Add other simulation agent action types here
        return this.formatAgentActionMetric(event);

      // --- Internal Agent Events ---
      case 'agent.cognitive.cycle.phase_completed':
        return this.formatStepTimingMetric(event);
      case 'learning.reward.recorded':
        return this.formatRewardMetric(event);
      case 'agent.state.dynamic.updated':
        return this.formatDynamicStateUpdateMetric(event);
      // case 'agent.internal.operation':
      //   return this.formatMemoryMetric(event);

      default:
        return null;
    }
  }

  formatAgentActionMetric(event: SimulationAgentActionEvent): Metric | null {
    let agentId: string;
    const actionSpecificFields: Record<string, any> = {};
    let durationMs = 0;
    let actionType: SimulationAgentActionEvent['type'];

    if (event.type === 'simulation.agent.speak') {
      agentId = event.payload.agentId;
      actionType = event.type;
      if (
        event.payload.metadata &&
        typeof event.payload.metadata === 'object' &&
        typeof event.payload.metadata.durationMs === 'number'
      ) {
        durationMs = event.payload.metadata.durationMs;
      }
    } else if (event.type === 'simulation.agent.move') {
      agentId = event.payload.agentId;
      actionType = event.type;
      actionSpecificFields.target = event.payload.target;
    } else {
      // Use type assertion as workaround for persistent linter error
      this.logger.warn(
        `Unhandled simulation action type in formatter: ${
          (event as SimulationAgentActionEvent).type
        }`,
      );
      return null;
    }

    return {
      name: 'agent_action',
      tags: { agentId: agentId, actionType: actionType },
      fields: { durationMs, ...actionSpecificFields },
      timestamp: event.timestamp,
    };
  }

  formatStepTimingMetric(event: CognitiveCyclePhaseCompletedEvent): Metric | null {
    if (event.type !== 'agent.cognitive.cycle.phase_completed') return null;
    const payload = event.payload;
    return {
      name: 'cognitive_step_timing',
      tags: { agentId: payload.agentId, stepName: payload.phase },
      fields: { durationMs: payload.durationMs },
      timestamp: event.timestamp,
    };
  }

  formatRewardMetric(event: LearningRewardRecordedEvent): Metric | null {
    if (event.type !== 'learning.reward.recorded') return null;
    const payload = event.payload;
    return {
      name: 'learning_reward',
      tags: { agentId: payload.agentId },
      fields: { rewardScore: payload.rewardScore },
      timestamp: event.timestamp,
    };
  }

  formatDynamicStateUpdateMetric(event: AgentDynamicStateUpdatedEvent): Metric | null {
    if (event.type !== 'agent.state.dynamic.updated') return null;
    const payload = event.payload;
    const fieldsToStore: Record<string, number | string | boolean> = {};

    if (payload.newState?.mood !== undefined) {
      fieldsToStore.mood = payload.newState.mood;
    }
    if (payload.newState?.participationInterest !== undefined) {
      fieldsToStore.participationInterest = payload.newState.participationInterest;
    }
    if (payload.newState?.curiosityLevel !== undefined) {
      fieldsToStore.curiosityLevel = payload.newState.curiosityLevel;
    }

    if (Object.keys(fieldsToStore).length === 0) {
      return null;
    }

    return {
      name: 'agent_dynamic_state',
      tags: { agentId: payload.agentId },
      // Note: The Metric schema expects fields to be Record<string, number>.
      // We might need to adjust the Metric schema or how we store non-numeric state.
      // For now, casting to 'any' to bypass, but this needs resolution.
      fields: fieldsToStore as any,
      timestamp: event.timestamp,
    };
  }
}
