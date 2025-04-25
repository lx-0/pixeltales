import { JsonOutputParser, StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { Runnable, RunnableConfig } from '@langchain/core/runnables';
import { ChatOpenAI } from '@langchain/openai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AgentAction, AgentState, OrientationContext } from '@pixeltales/contracts';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { IAgentLlmService } from './agent-llm.interface';

@Injectable()
export class AgentLlmService implements IAgentLlmService {
  private readonly logger = new Logger(AgentLlmService.name);
  private llm: ChatOpenAI | null = null;
  private actionChain: Runnable<any, string, RunnableConfig<Record<string, any>>> | null = null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const modelName = this.configService.get<string>('AGENT_LLM_MODEL', 'gpt-4o');

    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not found in config. LLM Service will not function.');
      return; // Prevent initialization if no key
    }

    this.logger.log(`Initializing AgentLlmService with model: ${modelName}`);
    try {
      this.llm = new ChatOpenAI({
        openAIApiKey: apiKey,
        modelName: modelName,
        temperature: 0.7,
        // Add other options like maxTokens if needed
      });

      // Define a simple prompt template
      const prompt = ChatPromptTemplate.fromMessages([
        [
          'system',
          'You are a character in an ongoing scene. Your persona: {persona}. Your current mood is {mood}. React to the latest event/perception concisely.',
        ],
        ['human', 'Latest Perception/Event: {perception_content}'],
      ]);

      // Define the output parser
      const parser = new StringOutputParser();

      // Create the runnable sequence (chain)
      this.actionChain = prompt.pipe(this.llm).pipe(parser);

      this.logger.log('LangChain action chain initialized successfully.');
    } catch (error) {
      this.logger.error('Failed to initialize LangChain components', error);
      this.llm = null; // Ensure LLM is null if init fails
      this.actionChain = null;
    }
  }

  /**
   * Generates a direct AgentAction based on the current context using LangChain.
   */
  async generateAction(
    agentId: string,
    context: OrientationContext,
    agentConfig?: AgentState['config'],
  ): Promise<AgentAction> {
    this.logger.debug(`[${agentId}] LLM generateAction called.`);

    if (!this.actionChain || !this.llm) {
      this.logger.error(`[${agentId}] LLM Action Chain or LLM not initialized.`);
      return { type: 'no_action', payload: { reason: 'LLM Service not initialized' } };
    }

    try {
      // Prepare input for the chain - extract content from the first perception or combine multiple perceptions
      let perceptionContent = 'No current perceptions';

      if (context.currentPerception && context.currentPerception.length > 0) {
        if (context.currentPerception.length === 1) {
          // Single perception
          const perception = context.currentPerception[0];
          perceptionContent =
            typeof perception?.content === 'string'
              ? perception.content
              : JSON.stringify(perception?.content ?? '');
        } else {
          // Multiple perceptions - combine them
          perceptionContent = context.currentPerception
            .map((p) => {
              const content = typeof p.content === 'string' ? p.content : JSON.stringify(p.content);
              return `[${p.type}] ${content}`;
            })
            .join('; ');
        }
      }

      const input = {
        persona: agentConfig?.personalityCore ?? 'a friendly character',
        mood: context.dynamicState.mood ?? 'neutral',
        perception_content: perceptionContent,
      };

      this.logger.verbose(
        `[${agentId}] Invoking LLM action chain with input: ${JSON.stringify(input).substring(0, 100)}...`,
      );

      // *** Execute the actual LangChain chain ***
      const llmResponse: string = await this.actionChain.invoke(input);

      this.logger.verbose(
        `[${agentId}] LLM response received: "${llmResponse.substring(0, 50)}..."`,
      );

      // Construct the AgentAction based on the LLM response
      const generatedAction: AgentAction = {
        type: 'speak', // Assuming the basic chain generates speech content
        payload: {
          content: llmResponse, // Use the direct string output
          tone: 'generated', // TODO: Could try to infer tone later or use structured output
        },
      };
      return generatedAction;
    } catch (error) {
      this.logger.error(
        `[${agentId}] Error during LLM action chain invocation`,
        error instanceof Error ? error.stack : error,
      );
      // Return no_action on error
      return { type: 'no_action', payload: { reason: 'LLM generation error' } };
    }
  }

  /**
   * Decomposes a high-level goal into steps.
   */
  async generatePlanSteps(
    agentId: string,
    goal: string,
    context: OrientationContext,
  ): Promise<string[]> {
    this.logger.debug(`[${agentId}] LLM generatePlanSteps called for goal: "${goal}"`);

    if (!this.llm) {
      this.logger.error(`[${agentId}] LLM not initialized for plan generation.`);
      return [`address the goal: ${goal}`]; // Fallback
    }

    try {
      // Define the steps schema using Zod
      const PlanStepsSchema = z.object({
        steps: z
          .array(z.string())
          .describe('List of 3-5 clear, actionable steps to achieve the goal'),
      });

      // Create a structured output parser
      const outputParser = new JsonOutputParser<z.infer<typeof PlanStepsSchema>>();

      // Get JSON schema for output formatting
      const formatInstructions = this.getFormatInstructions(PlanStepsSchema);

      // Create a specific prompt for goal decomposition with structured output
      const planningPrompt = ChatPromptTemplate.fromMessages([
        [
          'system',
          `You are a planning assistant for an agent in an interactive scene.

When given a goal, decompose it into 3-5 clear, concrete, actionable steps that the agent should take to achieve it.
Each step should be a simple instruction like "move to the door", "speak a greeting", etc.
Focus on physical actions, speech, and basic interactions.

Current agent mood: {mood}
Agent identity: {persona}
Current situation: {context_summary}

${formatInstructions}`,
        ],
        ['human', 'Goal: {goal}'],
      ]);

      // Create the planning chain with structured output
      const planningChain = planningPrompt.pipe(this.llm).pipe(outputParser);

      // Prepare context summary for prompt
      const contextSummary = this.summarizeContext(context);

      // Prepare inputs for the planning chain
      const planningInput = {
        goal: goal,
        persona: context.agentSelfConcept || 'a character in an interactive scene',
        mood: context.dynamicState?.mood || 'neutral',
        context_summary: contextSummary,
      };

      this.logger.verbose(
        `[${agentId}] Invoking planning chain with input: ${JSON.stringify(planningInput).substring(0, 100)}...`,
      );

      // Execute the planning chain
      const result = await planningChain.invoke(planningInput);
      const steps = result.steps;

      this.logger.verbose(
        `[${agentId}] Planning chain returned ${steps.length} steps: ${JSON.stringify(steps)}`,
      );

      return steps.length > 0 ? steps : [`address the goal: ${goal}`]; // Fallback if no steps generated
    } catch (error) {
      this.logger.error(
        `[${agentId}] Error during plan generation`,
        error instanceof Error ? error.stack : error,
      );
      // Return a simple fallback step on error
      return [`address the goal: ${goal}`];
    }
  }

  /**
   * Helper to summarize orientation context for prompts
   */
  private summarizeContext(context: OrientationContext): string {
    let summary = '';

    // Add current perception
    if (Array.isArray(context.currentPerception) && context.currentPerception.length > 0) {
      const recentPerceptions = context.currentPerception
        .slice(0, 3)
        .map((p) => (typeof p.content === 'string' ? p.content : JSON.stringify(p.content)));
      summary += `Just perceived: ${recentPerceptions.join('; ')}. `;
    }

    // Add time context if available
    if (context.currentTime) {
      const date = new Date(context.currentTime);
      summary += `Current time: ${date.toLocaleTimeString()}. `;
    }

    // Add recent observations if available
    if (
      context.recentObservations &&
      Array.isArray(context.recentObservations) &&
      context.recentObservations.length > 0
    ) {
      const recentObs = context.recentObservations
        .slice(0, 2)
        .map((obs) =>
          typeof obs.content === 'string' ? obs.content : JSON.stringify(obs.content),
        );
      summary += `Recent observations: ${recentObs.join('; ')}. `;
    }

    // Add related facts if available
    if (
      context.relatedFacts &&
      Array.isArray(context.relatedFacts) &&
      context.relatedFacts.length > 0
    ) {
      const relevantFacts = context.relatedFacts
        .slice(0, 3)
        .map(
          (fact) =>
            `${fact.key}: ${typeof fact.value === 'object' ? JSON.stringify(fact.value) : fact.value}`,
        );
      summary += `Known facts: ${relevantFacts.join('; ')}. `;
    }

    return summary || 'No specific context available.';
  }

  /**
   * Helper to generate format instructions for structured output
   */
  private getFormatInstructions(schema: z.ZodSchema): string {
    // Get the JSON schema representation
    const jsonSchema = zodToJsonSchema(schema);
    const jsonString = JSON.stringify(jsonSchema);

    // Double all curly braces in the JSON string to escape them for LangChain's template system
    const escapedJsonString = jsonString.replace(/({|})/g, '$1$1');

    return `You must format your output as a JSON value that adheres to a given "JSON Schema" instance.

"JSON Schema" is a declarative language that allows you to annotate and validate JSON documents.

Your output will be parsed and type-checked according to the provided schema instance, so make sure all fields in your output match the schema exactly and there are no trailing commas!

Here is the JSON Schema instance your output must adhere to:
\`\`\`json
${escapedJsonString}
\`\`\``;
  }

  // TODO: Implement other LLM methods
}
