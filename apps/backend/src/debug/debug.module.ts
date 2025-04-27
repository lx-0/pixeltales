import { Module } from '@nestjs/common';
import { CoreModule } from '../core/core.module'; // Import CoreModule for EventBus
import { DebugGateway } from './debug.gateway'; // Ensure relative path is correct

@Module({
  imports: [CoreModule], // Need EventBus from CoreModule
  providers: [DebugGateway], // Provide the gateway
  exports: [DebugGateway], // Export if needed elsewhere (unlikely for a gateway)
})
export class DebugModule {}
