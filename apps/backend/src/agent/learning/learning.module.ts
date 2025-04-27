import { Module } from '@nestjs/common';
import { MemoryModule } from '../memory/memory.module';
import { LEARNING_INTERFACE } from './learning.interface';
import { LearningService } from './learning.service';
import { RewardFunction } from './reward.function';
import { REWARD_FUNCTION } from './reward.function.interface'; // Import token
// Import MemoryModule if LearningService depends directly on memory services beyond the interface

@Module({
  imports: [MemoryModule],
  providers: [
    LearningService, // Concrete implementation
    // Provide the interface - uses the concrete implementation
    {
      provide: LEARNING_INTERFACE,
      useExisting: LearningService,
    },
    // Provide RewardFunction using the token
    {
      provide: REWARD_FUNCTION,
      useClass: RewardFunction,
    },
  ],
  exports: [
    LEARNING_INTERFACE, // Export the interface token
    REWARD_FUNCTION, // Export the token
  ],
})
export class LearningModule {}
