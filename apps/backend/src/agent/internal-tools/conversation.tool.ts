import { Injectable } from '@nestjs/common';

@Injectable()
export class ConversationTool {
  /**
   * Requests to end the conversation
   */
  run(conversationId: string, agentId: string): boolean {
    // TODO: integrate with ConversationStateService to set endConversationRequested
    return true;
  }
}
