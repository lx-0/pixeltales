import { Inject, Injectable, Logger } from '@nestjs/common';
import { ReflectionReport, uuid } from '@pixeltales/contracts';
import { EVENT_BUS, IEventBus } from '../../core/event-bus.interface';
import { EventBusService } from '../../core/event-bus.service';
import { AGENT_LLM_SERVICE, IAgentLlmService } from '../llm/agent-llm.interface';
import { IMemoryInterface, MEMORY_INTERFACE } from '../memory/memory.interface';
import { IOntologyInterface, ONTOLOGY_SERVICE } from '../ontology/ontology.interface';
import {
  ISelfModelingInterface,
  SELF_MODELING_SERVICE,
} from '../self-modeling/self-modeling.interface';
import { IReflectionService } from './reflection.interface';

@Injectable()
export class ReflectionService implements IReflectionService {
  private readonly logger = new Logger(ReflectionService.name);

  constructor(
    @Inject(MEMORY_INTERFACE) private readonly memory: IMemoryInterface,
    @Inject(SELF_MODELING_SERVICE) private readonly selfModeling: ISelfModelingInterface,
    @Inject(ONTOLOGY_SERVICE) private readonly ontology: IOntologyInterface,
    @Inject(AGENT_LLM_SERVICE) private readonly agentLlm: IAgentLlmService,
    @Inject(EVENT_BUS) private readonly eventBus: IEventBus,
  ) {}

  async performReflection(agentId: string, trigger: string): Promise<ReflectionReport> {
    this.logger.log(`[${agentId}] Starting reflection cycle (Trigger: ${trigger})...`);
    const startTime = Date.now();

    // 1. Retrieve recent experiences
    // TODO: Define criteria (e.g., last N observations, since last reflection)
    const observations = await this.memory.retrieveObservations(agentId, { limit: 20 });
    this.logger.verbose(
      `[${agentId}] Retrieved ${observations.length} observations for reflection.`,
    );

    if (observations.length === 0) {
      this.logger.log(`[${agentId}] No new observations to reflect on.`);
      // Return a minimal report indicating nothing was processed
      return {
        reportId: uuid(),
        timestamp: Date.now(),
        trigger,
        insights: [],
      };
    }

    // 2. Analyze experiences & Generate Insights (Call LLM Service)
    this.logger.debug(`[${agentId}] Analyzing experiences via LLM...`);
    let insights: ReflectionReport['insights'] = [];
    try {
      insights = await this.agentLlm.analyzeExperiencesForInsights(agentId, observations);
      this.logger.verbose(`[${agentId}] Generated ${insights.length} insights.`);
    } catch (error) {
      this.logger.error(`[${agentId}] Error during LLM insight generation`, error);
      // Continue even if LLM fails, report will have no insights
    }

    // 3. Delegate updates based on insights
    const selfUpdates = insights.filter((i) => i.type === 'self');
    const ontologyUpdates = insights.filter((i) => i.type === 'world'); // Add other types if needed

    if (selfUpdates.length > 0) {
      this.logger.debug(`[${agentId}] Delegating self-model updates...`);
      try {
        await this.selfModeling.applyReflectionInsights(agentId, selfUpdates);
      } catch (error) {
        this.logger.error(`[${agentId}] Error applying self-model insights`, error);
      }
    }
    if (ontologyUpdates.length > 0) {
      this.logger.debug(`[${agentId}] Delegating ontology updates...`);
      try {
        await this.ontology.applyReflectionInsights(agentId, ontologyUpdates);
      } catch (error) {
        this.logger.error(`[${agentId}] Error applying ontology insights`, error);
      }
    }

    // 4. Construct the final report
    const report: ReflectionReport = {
      reportId: uuid(),
      timestamp: Date.now(),
      trigger,
      processedObservationIds: observations.map((o) => o.id),
      insights: insights, // Use the generated insights
      // TODO: Populate potentialSelfModelUpdates, potentialOntologyUpdates, newGoalsSuggested
      // based on the actual analysis results if the LLM provides them directly
    };

    // 5. Persist the report (via Memory Service)
    try {
      await this.memory.addReflectionReport(agentId, report);
      this.logger.verbose(
        `[${agentId}] Persisted reflection report ${report.reportId} (Placeholder).`,
      );
    } catch (error) {
      this.logger.error(`[${agentId}] Error persisting reflection report`, error);
      // Continue even if persistence fails
    }

    // 6. Emit event
    const reflectionEvent = EventBusService.createEvent(
      ReflectionService.name,
      'agent.reflection.completed',
      {
        agentId,
        reportId: report.reportId,
        trigger,
        insightCount: report.insights.length,
        durationMs: Date.now() - startTime,
      },
    );
    this.eventBus.publish(reflectionEvent);

    this.logger.log(
      `[${agentId}] Reflection cycle completed in ${Date.now() - startTime}ms. Report: ${report.reportId}`,
    );
    return report;
  }
}
