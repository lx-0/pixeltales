import { AIMessage, HumanMessage } from '@langchain/core/messages';
import { Injectable } from '@nestjs/common';
import { LlmProviderId, Message, SceneConfig, SceneStateSnapshot } from '@pixeltales/contracts';
import { PinoLogger } from 'nestjs-pino';
import { TokenCounter } from '../../llm/token-counter';

@Injectable()
export class ConversationHistoryService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly tokenCounter: TokenCounter,
  ) {
    this.logger.setContext(ConversationHistoryService.name);
  }

  /**
   * Prepare conversation history for LLM context
   * This formats previous messages in a way that helps the LLM understand
   * the conversation from the character's perspective
   *
   * @param sceneState Current scene state with messages
   * @param characterId ID of the character for which to prepare context
   * @param sceneConfig Optional scene configuration for token calculations
   * @param provider Optional provider ID for token calculations
   */
  prepareConversationHistory(
    sceneState: SceneStateSnapshot,
    characterId: string,
    sceneConfig?: SceneConfig,
    provider?: LlmProviderId,
  ): Array<HumanMessage | AIMessage> {
    const history: Array<HumanMessage | AIMessage> = [];

    // Get the character's info
    const character = sceneState.characters[characterId];
    if (!character) {
      this.logger.warn(`Character ${characterId} not found, cannot prepare context`);
      return history;
    }

    // Extract messages, handling empty arrays
    const messages = sceneState.messages || [];
    if (messages.length === 0) {
      this.logger.debug(`No message history for character ${characterId}`);
      return history;
    }

    // If we don't have a scene config or provider, fall back to a fixed context window
    if (!sceneConfig || !provider) {
      return this.prepareFixedWindowConversationHistory(messages, characterId, 20);
    }

    // Get character-specific LLM config if available
    const characterConfig = sceneConfig.charactersConfig[characterId];
    if (!characterConfig || !characterConfig.llmConfig) {
      this.logger.warn(
        `No LLM config found for character ${characterId}, using default context window`,
      );
      return this.prepareFixedWindowConversationHistory(messages, characterId, 20);
    }

    const modelName = characterConfig.llmConfig.modelName;
    const maxOutputTokens = characterConfig.llmConfig.maxTokens;

    // Get model's context window size
    const contextWindowSize = this.tokenCounter.getContextWindow(modelName, provider);

    // Reserve tokens for:
    // 1. Model's max output tokens
    // 2. System prompt/instructions (rough estimate)
    // 3. Safety buffer (10%)
    const reservedTokens = maxOutputTokens + 500; // 500 is a rough estimate for system prompt
    const safetyBuffer = Math.floor(contextWindowSize * 0.1);
    const availableTokens = contextWindowSize - reservedTokens - safetyBuffer;

    // If we have a very limited token budget, use a minimal context
    if (availableTokens < 1000) {
      this.logger.warn(
        `Very limited token budget (${availableTokens}) for context, using minimal context`,
      );
      return this.prepareFixedWindowConversationHistory(messages, characterId, 5);
    }

    // Start with all messages and gradually reduce until we fit
    // First, convert all messages to LangChain format
    const allFormattedMessages = this.formatMessagesForCharacter(messages, characterId);

    // Start with all messages and count tokens
    const currentMessages = [...allFormattedMessages];
    const currentTokenCount = this.tokenCounter.estimateTokensForMessages(
      currentMessages,
      provider,
    );

    // If we're already under budget, return all messages
    if (currentTokenCount <= availableTokens) {
      this.logger.debug(
        `Using all ${currentMessages.length} messages (${currentTokenCount} tokens) for context`,
      );
      return currentMessages;
    }

    // Otherwise, we need to reduce context
    // Strategy: Remove messages from the middle, keeping recent ones and some early ones
    return this.reduceMessagesToFitTokenBudget(
      allFormattedMessages,
      messages,
      characterId,
      provider,
      availableTokens,
    );
  }

  /**
   * Format messages for a specific character
   * This converts each message to a HumanMessage or AIMessage from the character's perspective
   */
  private formatMessagesForCharacter(
    messages: Message[],
    characterId: string,
  ): Array<HumanMessage | AIMessage> {
    return messages.map((msg) => {
      if (msg.characterId !== characterId) {
        // Message from other characters -> Human message from this character's perspective
        const sender = msg.characterId;
        const content = !msg.content ? '' : `${sender}: ${msg.content}`;
        return new HumanMessage(content);
      } else {
        // Message from this character -> AI message from this character's perspective
        return new AIMessage(msg.content || '');
      }
    });
  }

  /**
   * Reduce messages to fit within token budget
   * This uses a strategy that keeps early and recent messages, removing ones from the middle
   */
  private reduceMessagesToFitTokenBudget(
    allFormattedMessages: Array<HumanMessage | AIMessage>,
    originalMessages: Message[],
    characterId: string,
    provider: LlmProviderId,
    availableTokens: number,
  ): Array<HumanMessage | AIMessage> {
    const recentMessageCount = Math.min(10, Math.floor(originalMessages.length / 2));
    let keepEarlyCount = 2; // Keep at least the first 2 messages for context
    let currentMessages = [...allFormattedMessages];
    let currentTokenCount = this.tokenCounter.estimateTokensForMessages(currentMessages, provider);

    // Keep reducing until we fit or hit minimum context
    while (
      currentTokenCount > availableTokens &&
      currentMessages.length > recentMessageCount + keepEarlyCount
    ) {
      // Remove messages from the middle (after early ones, before recent ones)
      const earlyMessages = allFormattedMessages.slice(0, keepEarlyCount);
      const recentMessages = allFormattedMessages.slice(-recentMessageCount);

      // Create a new context with early and recent messages
      currentMessages = [...earlyMessages, ...recentMessages];
      currentTokenCount = this.tokenCounter.estimateTokensForMessages(currentMessages, provider);

      // If we still don't fit, reduce early messages (but keep at least 1)
      if (currentTokenCount > availableTokens && keepEarlyCount > 1) {
        keepEarlyCount--;
      } else {
        // If we still don't fit and have kept only 1 early message, start reducing recent messages
        if (currentTokenCount > availableTokens && recentMessageCount > 3) {
          // Remove one recent message at a time until we fit
          currentMessages.splice(keepEarlyCount, 1);
          currentTokenCount = this.tokenCounter.estimateTokensForMessages(
            currentMessages,
            provider,
          );
        } else {
          // If we're still over budget with minimal context, we have to force a smaller context
          this.logger.warn(
            `Couldn't fit context within token budget, forcing minimal context (${currentTokenCount} > ${availableTokens})`,
          );
          return this.prepareFixedWindowConversationHistory(originalMessages, characterId, 5);
        }
      }
    }

    this.logger.debug(
      `Using ${currentMessages.length} messages (${currentTokenCount} tokens) for context window`,
    );

    return currentMessages;
  }

  /**
   * Fallback method that prepares conversation history with a fixed window size
   */
  private prepareFixedWindowConversationHistory(
    messages: Message[],
    characterId: string,
    windowSize: number,
  ): Array<HumanMessage | AIMessage> {
    const history: Array<HumanMessage | AIMessage> = [];

    // Get last N messages
    const recentMessages = messages.slice(-windowSize);

    this.logger.debug(`Using fixed window of ${recentMessages.length} messages for ${characterId}`);

    // Convert to LangChain message format
    for (const msg of recentMessages) {
      if (!msg.content) continue; // Skip empty messages

      if (msg.characterId !== characterId) {
        // Message from other characters -> Human message from this character's perspective
        const sender = msg.characterId;
        const formattedContent = `${sender}: ${msg.content}`;
        history.push(new HumanMessage(formattedContent));
      } else {
        // Message from this character -> AI message from this character's perspective
        history.push(new AIMessage(msg.content));
      }
    }

    return history;
  }
}
