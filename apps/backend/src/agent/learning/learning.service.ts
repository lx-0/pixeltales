import { Inject, Injectable, Logger } from '@nestjs/common';
import { AgentAction, AgentState } from '@pixeltales/contracts';
import { EVENT_BUS, IEventBus } from '../../core/event-bus.interface';
import { EventBusService } from '../../core/event-bus.service';
import { IMemoryInterface, MEMORY_INTERFACE } from '../memory/memory.interface';
import { ILearningInterface } from './learning.interface';

@Injectable()
export class LearningService implements ILearningInterface {
  private readonly logger = new Logger(LearningService.name);

  constructor(
    // Inject MemoryInterface to store experiences
    @Inject(MEMORY_INTERFACE) private readonly memoryInterface: IMemoryInterface,
    // Inject EventBus to publish learning events if needed
    @Inject(EVENT_BUS) private readonly eventBus: IEventBus,
    // Potentially inject RewardFunction implementation
  ) {
    // Subscribe to reward calculation events
    // Using any for event type due to persistent contract resolution issues
    this.eventBus.subscribe('agent.reward.calculated', (event) => {
      const payload = event.payload;
      // Basic validation before processing
      if (payload) {
        this.handleRewardCalculated(payload).catch((err) => {
          this.logger.error(
            `Error handling agent.reward.calculated for agent ${payload.agentId}`,
            err,
          );
        });
      } else {
        this.logger.warn('Received invalid agent.reward.calculated event payload', payload);
      }
    });
    this.logger.log('Subscribed to agent.reward.calculated events');
  }

  /** Handles the logic when a reward is calculated */
  private async handleRewardCalculated(payload: {
    stateSnapshot: AgentState;
    actionTaken: AgentAction;
    rewardScore: number;
  }): Promise<void> {
    this.logger.verbose(
      `[${payload.stateSnapshot.agentId}] Handling calculated reward: ${payload.rewardScore} for action ${payload.actionTaken.type}`,
    );
    // TODO: Store the experience tuple (state, action, reward) persistently.
    // This might involve specific formatting or storage in Episodic Memory via IMemoryInterface,
    // or a dedicated experience replay buffer.
    // Example placeholder storage:
    // await this.memoryInterface.addExperience({ stateSnapshot, agentAction, rewardScore });

    // Publish reward recorded event (separate from calculation)
    const rewardEvent = EventBusService.createEvent(
      LearningService.name,
      'learning.reward.recorded', // Use existing event type
      {
        agentId: payload.stateSnapshot.agentId,
        rewardScore: payload.rewardScore,
        // Add state/action identifiers if needed
      },
    );
    this.eventBus.publish(rewardEvent);
  }

  /** Record a reward tuple for a given state and action */
  // This method might become deprecated or internal if all rewards come via events
  /**
   * Record a reward tuple for a given state and action.
   * This method is deprecated and will be removed in future versions.
   * Use the handleRewardCalculated method instead.
   * @deprecated Direct calls to this method are not recommended. Dispatch event `agent.reward.calculated` instead.
   */
  async recordReward(
    stateSnapshot: AgentState,
    agentAction: AgentAction,
    rewardScore: number,
  ): Promise<void> {
    this.logger.warn(
      `[${stateSnapshot.agentId}] recordReward called directly (expected event). Reward: ${rewardScore}`,
    );
    // Delegate to the handler function for consistency
    await this.handleRewardCalculated({ stateSnapshot, actionTaken: agentAction, rewardScore });
  }

  /** Retrieve a batch of experiences for learning */
  async getExperienceBatch(
    batchSize: number,
    criteria?: any,
  ): Promise<{ state: AgentState; action: AgentAction; reward: number }[]> {
    this.logger.log(
      `LearningService: Getting experience batch (size ${batchSize}) with criteria:`,
      criteria,
    );
    // TODO: Retrieve a batch of experiences from the storage.
    // This might involve querying Episodic Memory or the replay buffer based on criteria.
    // Example placeholder retrieval:
    // return await this.memoryInterface.getExperienceBatch(batchSize, criteria);
    return []; // Placeholder
  }

  async updatePolicy(agentId: string): Promise<void> {
    this.logger.log(`LearningService: Triggering policy update for agent ${agentId}...`);
    // TODO: Implement the policy update logic.
    // 1. Retrieve relevant experiences using getExperienceBatch.
    // 2. Apply a learning algorithm (e.g., Q-learning, policy gradient, fine-tuning embeddings).
    // 3. Update the agent's decision-making parameters (e.g., planner weights, personalityCore embeddings stored in Semantic Memory or AgentConfig).
    // 4. Potentially update related facts/heuristics in Semantic Memory.

    const policyUpdateEvent = EventBusService.createEvent(
      'LearningService',
      'learning.policy.updated',
      { agentId },
    );
    this.eventBus.publish(policyUpdateEvent);

    this.logger.log(`LearningService: Policy update process completed for agent ${agentId}.`);
  }
}
