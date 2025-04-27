import { Module } from '@nestjs/common';
import { MemoryModule } from '../memory/memory.module'; // InternalToolsService depends on Memory
import { OntologyModule } from '../ontology/ontology.module';
import { SelfModelingModule } from '../self-modeling/self-modeling.module';
import { INTERNAL_TOOLS_INTERFACE } from './internal-tools.interface';
import { InternalToolsService } from './internal-tools.service';
// TODO: Import other dependency modules (SelfModeling, etc.) when available

@Module({
  imports: [
    MemoryModule, // Make IMemoryInterface available for injection
    OntologyModule,
    SelfModelingModule,
  ],
  providers: [
    {
      provide: INTERNAL_TOOLS_INTERFACE,
      useClass: InternalToolsService,
    },
    // InternalToolsService is implicitly provided by useClass above
  ],
  exports: [INTERNAL_TOOLS_INTERFACE], // Export token for injection elsewhere
})
export class InternalToolsModule {}
