import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from './config.service';
import { EVENT_BUS } from './event-bus.interface';
import { EventBusService } from './event-bus.service';
import { NotificationsModule } from './notifications/notification.module';
import { NotificationService } from './notifications/notification.service';
import { MetricsModule } from './stats/metrics.module';
import { StatsCollectorService } from './stats/stats-collector.service';
// Import Stats/Notification Modules when created
// import { StatsModule } from './stats/metrics.module';
// import { NotificationsModule } from './notifications/notification.module';

@Global() // Make core services available globally without importing CoreModule everywhere
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    NotificationsModule,
    MetricsModule,
  ],
  providers: [
    ConfigService,
    // Provide EventBusService for the IEventBus token
    {
      provide: EVENT_BUS,
      useClass: EventBusService,
    },
    // We'll provide NotificationService and StatsCollectorService in their own modules
    // But EventBusService needs to be here as it's the concrete class for the token
    EventBusService, // Also provide the concrete class if needed directly elsewhere (or remove if only interface is used)
    NotificationService, // Provided here for now, move to NotificationsModule later
    StatsCollectorService, // Provided here for now, move to StatsModule later
  ],
  exports: [
    ConfigService,
    EVENT_BUS, // Export the token
    EventBusService, // Export concrete class if needed
    NotificationService, // Export for now
    StatsCollectorService, // Export for now
  ],
})
export class CoreModule {}
