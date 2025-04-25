import { Injectable } from '@nestjs/common';

@Injectable()
export class MemoryTool {
  /**
   * Run memory operations: 'read' or 'write'
   */
  async run(type: 'read' | 'write', key: string, value?: any): Promise<any> {
    // TODO: integrate EpisodicMemoryService / SemanticMemoryService
    return null;
  }
}
