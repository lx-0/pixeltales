import { Module } from '@nestjs/common';
import { CoreModule } from '../core/core.module'; // For EventBus
import { SIMULATION_SERVICE } from './simulation.interface';
import { SimulationService } from './simulation.service';

@Module({
  imports: [CoreModule],
  providers: [
    {
      provide: SIMULATION_SERVICE,
      useClass: SimulationService,
    },
    SimulationService,
  ],
  exports: [SIMULATION_SERVICE],
})
export class SimulationModule {}
