import { ChatAnthropic } from '@langchain/anthropic';
import { BaseMessage } from '@langchain/core/messages';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { Runnable } from '@langchain/core/runnables';
import { ChatOpenAI } from '@langchain/openai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CharacterResponse,
  CharacterResponseSchema,
  LLMConfig,
  LLMProviderId,
  SceneConfigConfig,
} from '@pixeltales/contracts';
import { getMessageFromUnknownError } from '@pixeltales/utils';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { stripUnsupportedZod } from './strip-unsupported-zod.func';

// Type aliases similar to the Python version
type LLMConfigHash = number;
type ConversationRunnable = Runnable<StructuredOutputInput, CharacterResponse>;

// Type definition for system message template variables - using the ORIGINAL variable names
export interface SystemMessageVars {
  character_name: string;
  character_visual: string;
  character_role: string;
  message_recipient: string;
  scene_description: string;
  input: string;
  conversation_length: string;
  current_time: string;
  character_mood?: string;
}

// Define input type for structured output chain by extending SystemMessageVars
interface StructuredOutputInput extends SystemMessageVars {
  history: BaseMessage[];
  // [key: string]: string | BaseMessage[] | Record<string, unknown> | undefined;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private llmConfigs: Map<LLMConfigHash, LLMConfig> = new Map();
  private llms: Map<LLMConfigHash, ChatOpenAI | ChatAnthropic> = new Map();
  private chains: Map<LLMConfigHash, ConversationRunnable> = new Map();

  constructor(private readonly configService: ConfigService) {}

  /**
   * Initialize the LLMs for a scene, similar to Python's init_scene
   */
  initScene(sceneConfig: SceneConfigConfig): void {
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

  private initLlm(config: LLMConfig): void {
    const hash = this.hashLlmConfig(config);
    try {
      // Get the chat model
      const model = this.getChatModel(config);

      this.llms.set(hash, model);
      this.logger.debug(`Initialized LLM for config hash ${hash}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        { err: error },
        `Failed to initialize LLM for config hash ${hash}: ${errorMessage}`,
      );
      throw error;
    }
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
    for (const [_hash, config] of this.llmConfigs.entries()) {
      this.initLlm(config);
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
    const prompt = ChatPromptTemplate.fromMessages<StructuredOutputInput>([
      ['system', systemPrompt + '\n\n' + this.getFormatInstructions(CharacterResponseSchema)],
      new MessagesPlaceholder('history'),
      ['human', '{input}'],
    ]);

    // Create chains for each LLM
    for (const [hash, llm] of this.llms.entries()) {
      try {
        // Get the LLM config for the given hash
        const llmConfig = this.llmConfigs.get(hash);
        if (!llmConfig) {
          throw new Error(`LLM config not found for hash ${hash}`);
        }

        // Create a chain that validates the output with original schema
        const chain = prompt.pipe(
          llm
            .withStructuredOutput(stripUnsupportedZod(CharacterResponseSchema), {
              method: llmConfig.provider === 'openai' ? 'tool_calling' : 'function_calling',
            })
            .pipe((rawResult) => CharacterResponseSchema.parse(rawResult)),
        );

        this.chains.set(hash, chain);
        this.logger.debug(`Created conversation chain for config hash ${hash}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(
          { err: error },
          `Failed to create conversation chain for config hash ${hash}: ${errorMessage}`,
        );
        throw error;
      }
    }

    this.logger.log(`Initialized ${this.chains.size} conversation chains`);
  }

  /**
   * Create a chat model instance based on the provider
   */
  private getChatModel(llmConfig: LLMConfig): ChatOpenAI | ChatAnthropic {
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
  private prepareInputVars(input: StructuredOutputInput): StructuredOutputInput {
    // Prepare history separately as it's not part of SystemMessageVars
    const history = Array.isArray(input.history) ? input.history : [];

    this.logger.debug(`[prepareInputVars] Preparing input vars, history length: ${history.length}`);
    this.logger.debug(`[prepareInputVars] Input keys: ${Object.keys(input).join(', ')}`);

    // Get keys from SystemMessageVars by creating a dummy instance
    const dummyVars = {} as SystemMessageVars;
    const sysVarKeys = Object.keys(dummyVars); // TODO: check if character_mood is also in this list (as it is optional)

    this.logger.debug(`[prepareInputVars] SystemMessageVars keys: ${sysVarKeys.join(', ')}`);

    // Create a base object with empty strings for all SystemMessageVars fields
    const baseVars = sysVarKeys.reduce(
      (result, key) => ({ ...result, [key]: '' }),
      {} as SystemMessageVars,
    );

    // Override with special case defaults only when input doesn't provide a value
    if (!input.conversation_length) {
      baseVars.conversation_length = history.length.toString();
    }
    if (!input.current_time) {
      baseVars.current_time = new Date().toLocaleTimeString();
    }

    // Return the complete object with history and any additional properties
    const result = {
      ...baseVars,
      // Merge input values on top of defaults
      ...Object.fromEntries(
        Object.entries(input).filter(([key, value]) => value != null && sysVarKeys.includes(key)),
      ),
      // Add any additional properties from input not in SystemMessageVars
      ...Object.fromEntries(
        Object.entries(input).filter(
          ([key, value]) => value != null && !sysVarKeys.includes(key) && key !== 'history',
        ),
      ),
      // Always include history
      history,
    };

    this.logger.debug(`[prepareInputVars] Result keys: ${Object.keys(result).join(', ')}`);
    return result;
  }

  /**
   * Generate a character response based on conversation history and character info
   */
  async generateResponse(
    llmConfig: LLMConfig,
    input: StructuredOutputInput,
  ): Promise<z.infer<typeof CharacterResponseSchema>> {
    try {
      const hash = this.hashLlmConfig(llmConfig);

      this.logger.log(`[generateResponse] Starting response generation for ${hash}`);

      // Get the chain for the given hash / llm config
      const chain = this.chains.get(hash);
      if (!chain) {
        this.logger.error('[generateResponse] LLM chain not initialized');
        throw new Error('LLM chain not initialized');
      }

      // Use helper function to prepare input variables
      const preparedInput = this.prepareInputVars(input);

      // Call the model with structured output using stripped schema
      const result = await chain.invoke(preparedInput);
      this.logger.debug(`[generateResponse] Successfully generated response`);
      return result;
    } catch (error) {
      this.logger.error(
        { error },
        `[generateResponse] Error while generating response: ${getMessageFromUnknownError(error)}`,
      );
      throw new Error(`Error while generating response: ${getMessageFromUnknownError(error)}`);
    }
  }

  private getFormatInstructions(schema: z.ZodSchema): string {
    // Get the JSON schema representation
    const jsonSchema = zodToJsonSchema(schema);
    const jsonString = JSON.stringify(jsonSchema);

    // Double all curly braces in the JSON string to escape them for LangChain's template system
    const escapedJsonString = jsonString.replace(/({|})/g, '$1$1');

    return `You must format your output as a JSON value that adheres to a given "JSON Schema" instance.

"JSON Schema" is a declarative language that allows you to annotate and validate JSON documents.

For example, the example "JSON Schema" instance {{"properties": {{"foo": {{"description": "a list of test words", "type": "array", "items": {{"type": "string"}}}}}}, "required": ["foo"]}}
would match an object with one required property, "foo". The "type" property specifies "foo" must be an "array", and the "description" property semantically describes it as "a list of test words". The items within "foo" must be strings.
Thus, the object {{"foo": ["bar", "baz"]}} is a well-formatted instance of this example "JSON Schema". The object {{"properties": {{"foo": ["bar", "baz"]}}}} is not well-formatted.

Your output will be parsed and type-checked according to the provided schema instance, so make sure all fields in your output match the schema exactly and there are no trailing commas!

Here is the JSON Schema instance your output must adhere to. Include the enclosing markdown codeblock:
\`\`\`json
${escapedJsonString}
\`\`\`
`;
  }
}
