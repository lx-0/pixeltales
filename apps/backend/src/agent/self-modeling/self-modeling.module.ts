import { Module } from '@nestjs/common';
import { CoreModule } from '../../core/core.module'; // For EventBus
import { MemoryModule } from '../memory/memory.module'; // For IMemoryInterface
import { SELF_MODELING_SERVICE } from './self-modeling.interface';
import { SelfModelingService } from './self-modeling.service';

@Module({
  imports: [
    CoreModule,
    MemoryModule,
    // TODO: Import other dependencies if needed for reasoning logic
  ],
  providers: [
    {
      provide: SELF_MODELING_SERVICE,
      useClass: SelfModelingService,
    },
    SelfModelingService,
  ],
  exports: [SELF_MODELING_SERVICE],
})
export class SelfModelingModule {}
