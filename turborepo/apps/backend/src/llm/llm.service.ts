import { ChatAnthropic } from '@langchain/anthropic';
import { BaseMessage, HumanMessage } from '@langchain/core/messages';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
  SystemMessagePromptTemplate,
} from '@langchain/core/prompts';
import { Runnable } from '@langchain/core/runnables';
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
import { zodToJsonSchema } from 'zod-to-json-schema';
import { DEFAULT_SYSTEM_PROMPT, SystemMessageVars } from '../scene/scene.const';
import { stripUnsupportedZod } from './strip-unsupported-zod.func';

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
  private modelInitialized = false;
  private chatModel: ChatOpenAI | null = null;

  constructor(private readonly configService: ConfigService) {
    try {
      this.initializeModel();
      this.logger.log('Model initialized successfully');
      this.modelInitialized = true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error({ err: error }, `Failed to initialize model: ${errorMessage}`);
    }
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

        // Strip unsupported Zod features before sending to LLM API
        const strippedSchema = stripUnsupportedZod(CharacterResponseSchema);

        // Use withStructuredOutput with stripped schema
        const llmWithStripped = model.withStructuredOutput(strippedSchema, {
          method: config.provider === 'openai' ? 'tool_calling' : 'function_calling',
        });

        // Create a chain that validates the output with original schema
        const llm = llmWithStripped.pipe((rawResult) => {
          // Validate against the original schema
          return CharacterResponseSchema.parse(rawResult);
        });

        this.llms.set(hash, llm);
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

    this.logger.debug(
      `[prepareInputVars] Preparing input vars for ${externalId}, history length: ${history.length}`,
    );
    this.logger.debug(`[prepareInputVars] Input keys: ${Object.keys(input).join(', ')}`);

    // Get keys from SystemMessageVars by creating a dummy instance
    const dummyVars = {} as SystemMessageVars;
    const sysVarKeys = Object.keys(dummyVars);

    this.logger.debug(`[prepareInputVars] SystemMessageVars keys: ${sysVarKeys.join(', ')}`);

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
    const result = {
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

    this.logger.debug(`[prepareInputVars] Result keys: ${Object.keys(result).join(', ')}`);
    return result;
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
      this.logger.debug(`[generateResponse] Starting for ${externalId}`);

      if (!this.modelInitialized || !this.chatModel) {
        this.logger.error('[generateResponse] Model not initialized');
        throw new Error('Model not initialized');
      }

      this.logger.log('[generateResponse] Preparing input', { externalId });

      try {
        // Use helper function to prepare input variables
        const preparedInput = this.prepareInputVars(externalId, input);

        this.logger.debug(
          `[generateResponse] Prepared input with ${preparedInput.history.length} history items`,
        );

        // Extract history messages
        const historyMessages = Array.isArray(preparedInput.history) ? preparedInput.history : [];

        // Debug logs for template variables
        const inputKeys = Object.keys(preparedInput).filter((key) => key !== 'history');
        this.logger.debug(`[generateResponse] Template variables: ${inputKeys.join(', ')}`);

        try {
          // Get format instructions for the output schema
          const formatInstructions = this.getFormatInstructions(CharacterResponseSchema);

          // Create a combined system prompt with format instructions
          const fullPrompt = DEFAULT_SYSTEM_PROMPT + '\n\n' + formatInstructions;

          // Create a system message from the template
          const template = SystemMessagePromptTemplate.fromTemplate(fullPrompt);
          const systemMessage = await template.format(
            Object.fromEntries(Object.entries(preparedInput).filter(([key]) => key !== 'history')),
          );

          // Build the full message list
          const allMessages = [systemMessage, ...historyMessages].filter(
            (message): message is BaseMessage => message !== undefined,
          );

          if (preparedInput.input) {
            allMessages.push(new HumanMessage(preparedInput.input));
          }

          this.logger.debug(`[generateResponse] Created ${allMessages.length} messages`);

          // Strip unsupported Zod features before sending to LLM API
          const strippedSchema = stripUnsupportedZod(CharacterResponseSchema);

          // Call the model with structured output using stripped schema
          const rawResult = await this.chatModel
            .withStructuredOutput(strippedSchema, {
              method: 'tool_calling', // Explicitly use tool_calling for OpenAI models
            })
            .invoke(allMessages);

          // Validate against the original schema to ensure all constraints are satisfied
          const result = CharacterResponseSchema.parse(rawResult);

          this.logger.debug(`[generateResponse] Successfully generated response`);
          return result;
        } catch (templateError) {
          // If there's a template error, log it in detail and rethrow for central error handling
          const errorMsg =
            templateError instanceof Error ? templateError.message : String(templateError);
          this.logger.error(`[generateResponse] Template error: ${errorMsg}`);

          if (templateError instanceof Error && templateError.stack) {
            this.logger.error(`[generateResponse] Stack: ${templateError.stack}`);
          }

          // Rethrow the error for the central error handling
          throw new Error(`Template processing error: ${errorMsg}`);
        }
      } catch (error) {
        const errorJson =
          error instanceof Error
            ? JSON.stringify({ message: error.message, stack: error.stack })
            : JSON.stringify(error);
        this.logger.error(`[generateResponse] Error details: ${errorJson}`);

        if (error instanceof Error) {
          this.logger.error(`[generateResponse] Stack trace: ${error.stack}`);
        }

        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error(
          { err: error },
          `[generateResponse] Error generating character response: ${errorMessage}`,
        );
        throw new Error(`Failed to generate response: ${errorMessage}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('[generateResponse] Error in outer try/catch', {
        error: errorMessage,
        externalId,
      });
      throw error;
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

  /**
   * Initialize the ChatModel needed for generating structured responses
   */
  private initializeModel(): void {
    try {
      this.logger.log('[initializeModel] Starting initialization');

      this.chatModel = new ChatOpenAI({
        temperature: 0.7,
        modelName: 'gpt-4o',
        openAIApiKey: this.configService.get<string>('OPENAI_API_KEY'),
        maxTokens: 1000,
      });

      this.logger.debug('[initializeModel] Created chat model');

      // Debug logs for template inspection
      this.logger.debug(
        '[initializeModel] DEFAULT_SYSTEM_PROMPT first 100 chars: ' +
          DEFAULT_SYSTEM_PROMPT.substring(0, 100),
      );

      // Check for any potential unescaped braces in system prompt
      const openBraces = (DEFAULT_SYSTEM_PROMPT.match(/\{/g) || []).length;
      const closeBraces = (DEFAULT_SYSTEM_PROMPT.match(/\}/g) || []).length;
      this.logger.debug(
        `[initializeModel] Brace count in system prompt: { = ${openBraces}, } = ${closeBraces}`,
      );

      this.logger.debug('[initializeModel] Model initialized successfully');
      // Note: modelInitialized is set in the constructor's then() callback
      return; // Explicitly return to satisfy linter
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`[initializeModel] Error creating model: ${errorMessage}`);
      if (error instanceof Error && error.stack) {
        this.logger.error(`[initializeModel] Stack: ${error.stack}`);
      }
      throw new Error(`Failed to initialize model: ${errorMessage}`);
    }
  }
}
