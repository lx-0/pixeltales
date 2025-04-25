import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
// If formatters or other components are added, import them here
// Import CoreModule if it provides dependencies like EventBus directly,
// but often unnecessary if CoreModule is Global
// import { CoreModule } from '../core.module';

@Module({
  // imports: [CoreModule], // Only if needed and CoreModule is not Global
  providers: [
    NotificationService,
    // Add formatters or other providers if they exist
  ],
  exports: [NotificationService], // Export service if needed by other modules directly
})
export class NotificationsModule {}
