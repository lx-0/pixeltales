import { Injectable, Logger } from '@nestjs/common';
import { AgentConfig, AgentDynamicState, uuid } from '@pixeltales/contracts';
import { AgentRuntimeState } from './agent.state';

// Placeholder Dependencies - Inject real services later
// import { MemoryService } from './memory/memory.service';
// import { PlannerService } from './planner/planner.service';
// ... import other necessary services ...

/**
 * Responsible for creating initial AgentState objects.
 */
@Injectable()
export class AgentFactory {
  private readonly logger = new Logger(AgentFactory.name);

  constructor() {
    // TODO: Inject services if needed for more complex state initialization
    // (e.g., retrieving a base self-model from SelfModelingService)
  }

  /**
   * Creates the initial state for a new agent.
   * @param config The static configuration for the agent.
   * @param agentId Optional specific ID for the agent.
   * @returns The initial AgentRuntimeState object.
   */
  create(config: AgentConfig, agentId?: string): AgentRuntimeState {
    const id = agentId || uuid();
    this.logger.log(`Creating initial state for agent ${id}...`);

    // Create initial dynamic state
    const initialDynamicState: AgentDynamicState = {
      mood: 'neutral', // Default starting mood
      participationInterest: 0.75, // Default starting interest
      currentFocus: undefined,
      shortTermGoals: config.initialGoals || [], // Use goals from config or empty array
      curiosityLevel: 0.3, // Default starting curiosity
      uncertaintyMetrics: {}, // Start with no specific uncertainty
      selfConcept: 'New agent, learning...', // Basic initial self-concept
    };

    // Create an AgentRuntimeState instance instead of a plain object
    const runtimeState = new AgentRuntimeState(id, config, initialDynamicState);

    this.logger.log(`Initial state for agent ${id} created.`);
    return runtimeState;
  }
}
