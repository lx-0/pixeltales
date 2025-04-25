import { Module } from '@nestjs/common';
import { ExtensionsModule } from '../extensions/extensions.module'; // ActionService depends on Extensions
import { ACTION_SERVICE } from './action.interface';
import { ActionService } from './action.service';

@Module({
  imports: [
    ExtensionsModule, // Import ExtensionsModule here because ActionService injects CAPABILITY_EXTENSION providers from it
  ],
  providers: [
    {
      provide: ACTION_SERVICE,
      useClass: ActionService,
    },
    // ActionService is implicitly provided by useClass above, but explicitly listing it
    // can sometimes help with clarity or if it needs separate configuration.
    // ActionService, (Optional explicit provider if needed)
  ],
  exports: [ACTION_SERVICE], // Export the token so other modules can inject the service
})
export class ActionModule {}
