import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { EpisodicMemoryService } from './episodic-memory.service';
import { MEMORY_INTERFACE } from './memory.interface';
import { MemoryService } from './memory.service';
import { SemanticMemoryService } from './semantic-memory.service';

@Module({
  imports: [DbModule],
  providers: [
    EpisodicMemoryService, // Provide concrete implementations
    SemanticMemoryService,
    MemoryService, // Provide the facade service itself
    {
      provide: MEMORY_INTERFACE,
      useExisting: MemoryService, // Use the facade instance for the interface token
    },
  ],
  exports: [
    MEMORY_INTERFACE,
    // Optionally export concrete services if needed elsewhere, but usually just the interface
    // EpisodicMemoryService,
    // SemanticMemoryService,
  ],
})
export class MemoryModule {}
