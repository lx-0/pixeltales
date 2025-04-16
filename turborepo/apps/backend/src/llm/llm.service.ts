import { ChatAnthropic } from '@langchain/anthropic';
import { BaseMessage } from '@langchain/core/messages';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { Runnable, RunnableConfig, RunnableSequence } from '@langchain/core/runnables';
import { ChatOpenAI } from '@langchain/openai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CharacterResponse,
  CharacterResponseSchema,
  LLMConfig,
  LLMProviderId,
  SceneConfig,
} from '@pixeltales/contracts';
import { z } from 'zod';
import { DEFAULT_SYSTEM_PROMPT, SystemMessageVars } from '../scene/scene.const';

// Type aliases similar to the Python version
type LLMConfigHash = number;
type AnyRunnable = Runnable<any, CharacterResponse>;

// Define input type for structured output chain by extending SystemMessageVars
interface StructuredOutputInput extends SystemMessageVars {
  history: BaseMessage[];
  [key: string]: string | BaseMessage[] | Record<string, unknown> | undefined;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private llms: Map<LLMConfigHash, AnyRunnable> = new Map();
  private prompt: ChatPromptTemplate | null = null;
  private chains: Map<LLMConfigHash, AnyRunnable> = new Map();
  private llmConfigs: Map<LLMConfigHash, LLMConfig> = new Map();
  private chainsInitialized = false;
  private structuredOutputChain: Runnable<
    StructuredOutputInput,
    z.infer<typeof CharacterResponseSchema>,
    RunnableConfig
  > | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initializeChains()
      .then(() => {
        this.logger.log('Chains initialized successfully');
        this.chainsInitialized = true;
      })
      .catch((error) => {
        this.logger.error('Failed to initialize chains', error);
      });
  }

  /**
   * Initialize the LLMs for a scene, similar to Python's init_scene
   */
  initScene(sceneConfig: SceneConfig): void {
    this.logger.log('Initializing LLMs for scene');

    const llmConfigsByExternalId = Object.fromEntries(
      Object.entries(sceneConfig.characters_config).map(([charId, charConfig]) => [
        charId,
        charConfig.llm_config,
      ]),
    );

    // Map characters to LLMs via llm_config hash
    const [llmConfigs, _externalIdToLlmHashMap] = this.reduceLlmConfig(llmConfigsByExternalId);

    // Convert to Maps
    this.llmConfigs = new Map(
      Object.entries(llmConfigs).map(([hash, config]) => [Number(hash), config]),
    );

    this.initLlms();
    this.initConversationChain(sceneConfig.system_prompt);

    this.logger.log(
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

    this.logger.log(`Initialized ${this.llms.size} unique LLM instances`);
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

    this.logger.log(`Initialized ${this.chains.size} conversation chains`);
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
   * Helper to prepare input variables with defaults for any SystemMessageVars
   */
  private prepareInputVars(
    externalId: string,
    input: Record<string, unknown>,
  ): StructuredOutputInput {
    // Prepare history separately as it's not part of SystemMessageVars
    const history = Array.isArray(input.history) ? input.history : [];

    // Get keys from SystemMessageVars by creating a dummy instance
    const dummyVars = {} as SystemMessageVars;
    const sysVarKeys = Object.keys(dummyVars);

    // Create a base object with empty strings for all SystemMessageVars fields
    const baseVars = sysVarKeys.reduce(
      (result, key) => ({ ...result, [key]: '' }),
      {} as SystemMessageVars,
    );

    // Override with special case defaults only when input doesn't provide a value
    if (!input.character_name) {
      baseVars.character_name = externalId;
    }

    if (!input.conversation_length) {
      baseVars.conversation_length = history.length.toString();
    }

    if (!input.current_time) {
      baseVars.current_time = new Date().toLocaleTimeString();
    }

    // Merge input values on top of defaults
    const mergedVars = {
      ...baseVars,
      ...Object.fromEntries(
        Object.entries(input).filter(([key, value]) => value != null && sysVarKeys.includes(key)),
      ),
    };

    // Return the complete object with history and any additional properties
    return {
      ...mergedVars,
      // Add any additional properties from input not in SystemMessageVars
      ...Object.fromEntries(
        Object.entries(input).filter(
          ([key, value]) => value != null && !sysVarKeys.includes(key) && key !== 'history',
        ),
      ),
      // Always include history
      history,
    };
  }

  /**
   * Generate a character response based on conversation history and character info
   */
  async generateResponse(
    externalId: string,
    input: {
      history: BaseMessage[];
      [key: string]: any;
    },
  ): Promise<z.infer<typeof CharacterResponseSchema>> {
    try {
      if (!this.chainsInitialized || !this.structuredOutputChain) {
        this.logger.error('Chains not initialized');
        throw new Error('Chains not initialized');
      }

      this.logger.log('Generating character response', { externalId });

      try {
        // Use helper function to prepare input variables
        const preparedInput = this.prepareInputVars(externalId, input);

        // Generate response using prepared input
        const result = await this.structuredOutputChain.invoke(preparedInput);

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(`Error generating character response: ${errorMessage}`);
        throw new Error(`Failed to generate response: ${errorMessage}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Error generating character response', {
        error: errorMessage,
        externalId,
      });
      throw error;
    }
  }

  private async initializeChains(): Promise<void> {
    try {
      this.logger.log('Initializing chains');
      const structuredOutputParser = StructuredOutputParser.fromZodSchema(CharacterResponseSchema);

      const chatModel = new ChatOpenAI({
        temperature: 0.7,
        modelName: 'gpt-4o',
        openAIApiKey: this.configService.get<string>('OPENAI_API_KEY'),
        maxTokens: 1000,
      });

      // Replace PromptTemplate with ChatPromptTemplate that has proper messages format
      const systemTemplate = DEFAULT_SYSTEM_PROMPT + '\n\n{format_instructions}';

      const chatPrompt = ChatPromptTemplate.fromMessages([
        ['system', systemTemplate],
        new MessagesPlaceholder('history'),
      ]);

      const formatInstructions = structuredOutputParser.getFormatInstructions();

      this.structuredOutputChain = RunnableSequence.from([
        {
          // Map input variables to template variables
          messages: (input: StructuredOutputInput) => {
            // Create messages directly instead of using format
            return [
              {
                type: 'system',
                content: systemTemplate
                  .replace('{character_name}', input.character_name)
                  .replace('{character_visual}', input.character_visual || '')
                  .replace('{character_role}', input.character_role || '')
                  .replace('{scene_description}', input.scene_description || '')
                  .replace('{conversation_length}', input.conversation_length || '0')
                  .replace('{current_time}', input.current_time || new Date().toLocaleTimeString())
                  .replace('{format_instructions}', formatInstructions),
              },
              ...input.history,
            ];
          },
        },
        chatModel.withStructuredOutput(CharacterResponseSchema),
      ]);

      this.logger.log('Chains created successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error creating chains: ${errorMessage}`);
      throw new Error(`Failed to create chains: ${errorMessage}`);
    }
  }
}
