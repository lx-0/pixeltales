import { ChatAnthropic } from '@langchain/anthropic';
import { AIMessage, HumanMessage } from '@langchain/core/messages';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { Runnable } from '@langchain/core/runnables';
import { ChatOpenAI } from '@langchain/openai';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CharacterResponse,
  CharacterResponseSchema,
  LLMConfig,
  LLMProviderId,
  SceneConfig,
} from '@pixeltales/contracts';
import { randomUUID } from 'crypto';
import { PinoLogger } from 'nestjs-pino';

// Type aliases similar to the Python version
type LLMConfigHash = number;

type AnyRunnable = Runnable<any, CharacterResponse>;

// Interface for SystemPromptTemplateVars
interface SystemPromptTemplateVars {
  [key: string]: string | Array<HumanMessage | AIMessage> | Record<string, unknown>;
}

@Injectable()
export class LlmService {
  private llms: Map<LLMConfigHash, AnyRunnable> = new Map();
  private prompt: ChatPromptTemplate | null = null;
  private chains: Map<LLMConfigHash, AnyRunnable> = new Map();
  private llmConfigs: Map<LLMConfigHash, LLMConfig> = new Map();
  private externalIdToLlmHashMap: Map<string, LLMConfigHash> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(LlmService.name);
  }

  /**
   * Initialize the LLMs for a scene, similar to Python's init_scene
   */
  initScene(sceneConfig: SceneConfig): void {
    this.logger.info('Initializing LLMs for scene');

    const llmConfigsByExternalId = Object.fromEntries(
      Object.entries(sceneConfig.characters_config).map(([charId, charConfig]) => [
        charId,
        charConfig.llm_config,
      ]),
    );

    // Map characters to LLMs via llm_config hash
    const [llmConfigs, externalIdToLlmHashMap] = this.reduceLlmConfig(llmConfigsByExternalId);

    // Convert to Maps
    this.llmConfigs = new Map(
      Object.entries(llmConfigs).map(([hash, config]) => [Number(hash), config]),
    );

    this.externalIdToLlmHashMap = new Map(
      Object.entries(externalIdToLlmHashMap).map(([id, hash]) => [id, hash]),
    );

    this.initLlms();
    this.initConversationChain(sceneConfig.system_prompt);

    this.logger.info(
      `Initialized LLMs for ${Object.keys(llmConfigsByExternalId).length} characters`,
    );
  }

  /**
   * Get API key for the specified provider
   */
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
   * Reduce LLM configurations to unique configs based on hash
   */
  private reduceLlmConfig(
    llmConfigsById: Record<string, LLMConfig>,
  ): [Record<LLMConfigHash, LLMConfig>, Record<string, LLMConfigHash>] {
    // Create hash for each unique config
    const uniqueConfigs: Record<LLMConfigHash, LLMConfig> = {};
    const idToHashMap: Record<string, LLMConfigHash> = {};

    for (const [charId, llmConfig] of Object.entries(llmConfigsById)) {
      // Simple hash function - could be improved with a more robust hashing method
      const hash = this.hashLlmConfig(llmConfig);
      uniqueConfigs[hash] = llmConfig;
      idToHashMap[charId] = hash;
    }

    return [uniqueConfigs, idToHashMap];
  }

  /**
   * Create a hash for an LLM config
   */
  private hashLlmConfig(config: LLMConfig): number {
    // Simple hash function - in production you should use a more robust hashing method
    const str = `${config.provider}:${config.model_name}:${config.temperature}:${config.max_tokens}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }

  /**
   * Initialize LLMs for each unique config
   */
  private initLlms(): void {
    this.logger.debug('Initializing LLMs');

    if (this.llmConfigs.size === 0) {
      throw new Error('LLM configs not initialized');
    }

    // Create LLM for each unique config
    for (const [hash, config] of this.llmConfigs.entries()) {
      try {
        const model = this.getChatModel(config);

        // Use withStructuredOutput instead of createStructuredOutputRunnable (which is deprecated)
        const llm = model.withStructuredOutput(CharacterResponseSchema);

        this.llms.set(hash, llm);
        this.logger.debug(`Initialized LLM for config hash ${hash}`);
      } catch (error) {
        this.logger.error({ err: error }, `Failed to initialize LLM for config hash ${hash}`);
        throw error;
      }
    }

    this.logger.info(`Initialized ${this.llms.size} unique LLM instances`);
  }

  /**
   * Initialize the conversation chain with the system prompt
   */
  private initConversationChain(systemPrompt: string): void {
    this.logger.debug('Initializing conversation chains');

    if (this.llms.size === 0) {
      throw new Error('LLMs not initialized');
    }

    // Create prompt template
    this.prompt = ChatPromptTemplate.fromMessages([
      ['system', systemPrompt],
      new MessagesPlaceholder('history'),
      ['human', '{input}'],
    ]);

    // Create chains for each LLM
    for (const [hash, llm] of this.llms.entries()) {
      try {
        // Use pipe() method instead of RunnableSequence.from()
        const chain = this.prompt.pipe(llm);
        this.chains.set(hash, chain);
        this.logger.debug(`Created conversation chain for config hash ${hash}`);
      } catch (error) {
        this.logger.error(
          { err: error },
          `Failed to create conversation chain for config hash ${hash}`,
        );
        throw error;
      }
    }

    this.logger.info(`Initialized ${this.chains.size} conversation chains`);
  }

  /**
   * Create a chat model instance based on the provider
   */
  getChatModel(llmConfig: LLMConfig): ChatOpenAI | ChatAnthropic {
    this.logger.debug(`Creating chat model for config: ${JSON.stringify(llmConfig)}`);
    const apiKey = this.getApiKey(llmConfig.provider);

    if (llmConfig.provider === 'openai') {
      return new ChatOpenAI({
        apiKey,
        modelName: llmConfig.model_name,
        maxTokens: llmConfig.max_tokens,
        temperature: llmConfig.temperature,
      });
    } else if (llmConfig.provider === 'anthropic') {
      return new ChatAnthropic({
        apiKey,
        modelName: llmConfig.model_name,
        maxTokens: llmConfig.max_tokens,
        temperature: llmConfig.temperature,
      });
    }

    // Add a type assertion to avoid the "never" type error
    const provider = llmConfig.provider as string;
    this.logger.error(`Unsupported LLM provider: ${provider}`);
    throw new Error(`Unsupported LLM provider: ${provider}`);
  }

  /**
   * Generate a response for a character, with retry logic
   */
  async generateResponse(
    characterId: string,
    input: SystemPromptTemplateVars,
  ): Promise<CharacterResponse> {
    if (!this.chains.size) {
      throw new Error('Chains not initialized');
    }

    if (!this.externalIdToLlmHashMap.has(characterId)) {
      throw new Error(`Character ID ${characterId} not found in LLM mapping`);
    }

    const llmConfigHash = this.externalIdToLlmHashMap.get(characterId)!;
    const chain = this.chains.get(llmConfigHash);

    if (!chain) {
      throw new Error(`No chain found for config hash ${llmConfigHash}`);
    }

    // Retry settings
    const maxRetries = 3;
    let retryCount = 0;
    let backoffTime = 500; // Start with 500ms

    let lastError: Error | null = null;

    while (retryCount < maxRetries) {
      try {
        this.logger.debug(
          `Generating response for ${characterId} (attempt ${retryCount + 1}/${maxRetries})`,
        );

        // Add trace ID for correlating logs
        const traceId = randomUUID().substring(0, 8);
        this.logger.debug({ traceId }, 'Starting LLM call');

        const result = await chain.invoke(input);

        this.logger.debug(
          { traceId, result: JSON.stringify(result) },
          'Generated response successfully',
        );

        return result;
      } catch (error) {
        retryCount++;
        lastError = error as Error;

        // Add jitter to backoff
        const jitter = Math.random() * 100;
        const waitTime = backoffTime + jitter;

        this.logger.warn(
          {
            err: error,
            characterId,
            retryCount,
            maxRetries,
            waitTime,
          },
          `Error generating response, retrying in ${Math.round(waitTime)}ms`,
        );

        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        backoffTime *= 2;
      }
    }

    this.logger.error(
      { err: lastError, characterId },
      `Failed to generate response after ${maxRetries} attempts`,
    );

    throw new Error(
      `Failed to generate response for ${characterId} after ${maxRetries} attempts: ${lastError?.message}`,
    );
  }
}
