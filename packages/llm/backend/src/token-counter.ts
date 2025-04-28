import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmProviderId } from '@yesterday-ai/llm-contracts';
import { PinoLogger } from 'nestjs-pino';

// We'll use a simple approximation for non-OpenAI models
// 1 token ≈ 4 characters for English text
const TOKENS_PER_CHAR = 0.25;

/**
 * Utility service for estimating token usage in messages
 * Supports OpenAI and Anthropic models with different estimation methods
 */
@Injectable()
export class TokenCounter {
  constructor(
    private readonly logger: PinoLogger,
    private readonly configService: ConfigService,
  ) {
    this.logger.setContext(TokenCounter.name);
  }

  /**
   * Estimate tokens for a list of messages
   */
  estimateTokensForMessages(messages: BaseMessage[], provider: LlmProviderId = 'openai'): number {
    try {
      let tokenCount = 0;

      for (const message of messages) {
        tokenCount += this.estimateTokensForMessage(message, provider);
      }

      // Add overhead for message formatting based on provider
      const messagesOverhead = this.getMessagesOverhead(messages.length, provider);
      tokenCount += messagesOverhead;

      return tokenCount;
    } catch (error) {
      this.logger.warn({ err: error }, 'Error estimating token count, using approximation instead');
      // Fallback: Just get a rough estimate based on combined text length
      const totalText = messages
        .map((m) => {
          return typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
        })
        .join(' ');
      return Math.ceil(totalText.length * TOKENS_PER_CHAR);
    }
  }

  /**
   * Estimate tokens for a single message
   */
  estimateTokensForMessage(message: BaseMessage, provider: LlmProviderId): number {
    // Use different estimation approaches depending on model provider
    if (provider === 'anthropic') {
      return this.estimateTokensForAnthropicMessage(message);
    } else {
      return this.estimateTokensForOpenAIMessage(message);
    }
  }

  /**
   * Estimate tokens for a message with Anthropic-specific logic
   */
  private estimateTokensForAnthropicMessage(message: BaseMessage): number {
    // Simple approximation for Anthropic models
    // Anthropic Claude uses BPE tokenization similar to OpenAI
    // but with some differences in token boundaries
    const content =
      typeof message.content === 'string' ? message.content : JSON.stringify(message.content);

    // Role overhead for different message types
    let roleOverhead = 4; // Default

    if (message instanceof SystemMessage) {
      roleOverhead = 11; // Anthropic system message overhead
    } else if (message instanceof HumanMessage) {
      roleOverhead = 8; // Anthropic human message overhead
    } else if (message instanceof AIMessage) {
      roleOverhead = 8; // Anthropic assistant message overhead
    }

    // Content tokens (rough approximation)
    const contentTokens = Math.ceil(content.length * TOKENS_PER_CHAR);

    return roleOverhead + contentTokens;
  }

  /**
   * Estimate tokens for a message with OpenAI-specific logic
   */
  private estimateTokensForOpenAIMessage(message: BaseMessage): number {
    // For OpenAI, each message follows format:
    // <im_start>{role/name}\n{content}<im_end>\n
    // with different token counts:

    const content =
      typeof message.content === 'string' ? message.content : JSON.stringify(message.content);

    // Role overhead for different message types
    let roleOverhead = 4; // Default is 4 tokens for role overhead

    if (message instanceof SystemMessage) {
      roleOverhead = 5; // System role overhead
    } else if (message instanceof HumanMessage) {
      roleOverhead = 5; // Human role overhead
    } else if (message instanceof AIMessage) {
      roleOverhead = 5; // Assistant role overhead
    }

    // Content tokens (rough approximation)
    const contentTokens = Math.ceil(content.length * TOKENS_PER_CHAR);

    return roleOverhead + contentTokens;
  }

  /**
   * Get overhead tokens based on message count and provider
   */
  private getMessagesOverhead(messageCount: number, provider: LlmProviderId): number {
    if (provider === 'anthropic') {
      // Anthropic has a relatively small constant overhead for the conversation
      return 20;
    } else {
      // OpenAI has some overhead for each conversation
      // Plus a small amount for each message
      return 4 + messageCount * 2;
    }
  }

  /**
   * Get the max context window size for a specific model
   */
  getContextWindow(modelName: string, provider: LlmProviderId): number {
    // Default context window sizes for common models
    if (provider === 'openai') {
      // OpenAI models
      if (modelName.includes('gpt-4-turbo') || modelName.includes('gpt-4o')) {
        return 128000;
      } else if (modelName.includes('gpt-4-32k')) {
        return 32768;
      } else if (modelName.includes('gpt-4')) {
        return 8192;
      } else if (modelName.includes('gpt-3.5-turbo-16k')) {
        return 16384;
      } else if (modelName.includes('gpt-3.5')) {
        return 4096;
      }
    } else if (provider === 'anthropic') {
      // Anthropic models
      if (modelName.includes('claude-3-opus')) {
        return 200000;
      } else if (modelName.includes('claude-3-sonnet')) {
        return 180000;
      } else if (modelName.includes('claude-3-haiku')) {
        return 150000;
      } else if (modelName.includes('claude-2')) {
        return 100000;
      } else if (modelName.includes('claude-instant')) {
        return 100000;
      }
    }

    // Default fallback - be conservative
    this.logger.warn(
      `Unknown model "${modelName}" from provider "${provider}", using default context window size`,
    );
    return 4096;
  }
}
