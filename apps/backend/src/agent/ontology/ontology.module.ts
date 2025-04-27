import { Module } from '@nestjs/common';
import { CoreModule } from '../../core/core.module'; // Assuming DB is provided via Core or DbModule
import { ONTOLOGY_SERVICE } from './ontology.interface';
import { OntologyService } from './ontology.service';
import { MemoryModule } from '../memory/memory.module';

@Module({
  imports: [CoreModule, MemoryModule], // Or DbModule if DB injection is separate
  providers: [
    {
      provide: ONTOLOGY_SERVICE,
      useClass: OntologyService,
    },
    OntologyService, // Provide concrete class for potential direct injection
  ],
  exports: [ONTOLOGY_SERVICE], // Export token
})
export class OntologyModule {}
