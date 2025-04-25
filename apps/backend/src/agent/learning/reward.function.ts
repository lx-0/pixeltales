import { Injectable, Logger } from '@nestjs/common';
import { RewardFunctionInput } from '@pixeltales/contracts';
import { IRewardFunction } from './reward.function.interface';

@Injectable()
export class RewardFunction implements IRewardFunction {
  private readonly logger = new Logger(RewardFunction.name);

  compute(input: RewardFunctionInput): number {
    this.logger.debug(
      `Computing reward for action: ${input.actionTaken.type}, agent state: ${input.currentState.mood}`,
    );

    let reward = 0.0;

    // --- Placeholder Reward Logic --- //
    // TODO: Implement sophisticated reward calculation based on blueprint/requirements

    // Example: Reward for making progress on a goal
    if (input.goalProgress !== undefined) {
      // Assuming higher progress is better (e.g., change from 0.2 to 0.8 => 0.6 progress)
      // We might need previous goal progress state for delta calculation
      reward += input.goalProgress > 0.5 ? 0.5 : 0.1; // Simple reward for any progress > 0.5
      this.logger.verbose(`Added goal progress reward component: ${reward}`);
    }

    // Example: Reward/Penalize based on conversation rating
    if (input.conversationRating !== undefined) {
      reward += input.conversationRating * 0.2; // Scale rating impact
      this.logger.verbose(`Added conversation rating reward component: ${reward}`);
    }

    // Example: Reward for information gain (curiosity)
    if (input.informationGain !== undefined && input.informationGain > 0) {
      reward += input.informationGain * 0.1; // Small reward for gaining info
      this.logger.verbose(`Added information gain reward component: ${reward}`);
    }

    // Example: Small penalty for 'no_action' unless it was appropriate?
    if (input.actionTaken.type === 'no_action') {
      reward -= 0.05;
      this.logger.verbose(`Applied no_action penalty: ${reward}`);
    }

    // Ensure reward is within a reasonable range (e.g., -1 to 1)
    const finalReward = Math.max(-1, Math.min(1, reward));

    this.logger.log(`Computed final reward: ${finalReward} for action ${input.actionTaken.type}`);

    return finalReward;
  }
}
