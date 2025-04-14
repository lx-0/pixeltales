import { ChatAnthropic } from '@langchain/anthropic'; // Example for Anthropic
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LLMConfig, LLMProviderId } from '@pixeltales/contracts'; // Import config types
import { ConversationChain } from 'langchain/chains'; // Import necessary chain
import { BufferMemory } from 'langchain/memory'; // Example memory
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class LlmService {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(LlmService.name);
  }

  private getApiKey(provider: LLMProviderId): string {
    let apiKey: string | undefined;
    if (provider === 'openai') {
      apiKey = this.configService.get<string>('OPENAI_API_KEY');
    } else if (provider === 'anthropic') {
      apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    }
    if (!apiKey) {
      this.logger.error(`API key for provider '${provider}' not found in environment variables.`);
      throw new Error(`Missing API key for ${provider}`);
    }
    return apiKey;
  }

  /**
   * Creates an instance of a LangChain chat model based on the provided config.
   */
  getChatModel(llmConfig: LLMConfig): ChatOpenAI | ChatAnthropic /* | Other models */ {
    this.logger.debug(`Creating chat model for config: ${JSON.stringify(llmConfig)}`);
    const apiKey = this.getApiKey(llmConfig.provider);

    if (llmConfig.provider === 'openai') {
      return new ChatOpenAI({
        apiKey: apiKey,
        modelName: llmConfig.model_name,
        maxTokens: llmConfig.max_tokens,
        temperature: llmConfig.temperature,
        // Add other OpenAI specific options if needed
      });
    } else if (llmConfig.provider === 'anthropic') {
      return new ChatAnthropic({
        apiKey: apiKey,
        modelName: llmConfig.model_name,
        maxTokens: llmConfig.max_tokens, // Note: Anthropic uses max_tokens_to_sample
        temperature: llmConfig.temperature,
        // Add other Anthropic specific options if needed
      });
    }
    // Add other providers here
    else {
      this.logger.error(`Unsupported LLM provider`);
      throw new Error(`Unsupported LLM provider`);
    }
  }

  /**
   * Example of creating a simple conversation chain for a character.
   * This would likely live in the SceneManagerService or a dedicated AgentService.
   */
  async createCharacterChain(
    characterId: string,
    systemPrompt: string,
    llmConfig: LLMConfig,
  ): Promise<ConversationChain> {
    this.logger.info(`Creating conversation chain for character ${characterId}`);
    const chatModel = this.getChatModel(llmConfig);

    // TODO: Replace with Redis-backed memory later
    const memory = new BufferMemory({ memoryKey: 'history' });

    // Basic prompt template - needs refinement based on actual conversation flow
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', systemPrompt],
      ['placeholder', '{history}'],
      ['human', '{input}'],
    ]);

    const chain = new ConversationChain({
      llm: chatModel,
      memory: memory,
      prompt: prompt,
      // outputParser: new StringOutputParser(), // Optional: Depends on desired output
      verbose: this.configService.get<string>('NODE_ENV') !== 'production', // Log chain steps in dev
    });

    return chain;
  }
}
