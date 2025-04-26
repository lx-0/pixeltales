import { JsonOutputParser, StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { Runnable, RunnableConfig } from '@langchain/core/runnables';
import { ChatOpenAI } from '@langchain/openai';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AgentAction,
  AgentPlan,
  AgentState,
  Observation,
  OrientationContext,
  PlanNodeSchema,
  ReflectionReport,
  ReflectionReportSchema,
  uuid,
} from '@pixeltales/contracts';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { CircuitBreakerService } from '../../core/resilience/circuit-breaker.service';
import { IAgentLlmService } from './agent-llm.interface';

@Injectable()
export class AgentLlmService implements IAgentLlmService {
  private readonly logger = new Logger(AgentLlmService.name);
  private llm: ChatOpenAI | null = null;
  private actionChain: Runnable<any, string, RunnableConfig<Record<string, any>>> | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly circuitBreaker: CircuitBreakerService,
  ) {
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

    const operationKey = `llm_generateAction_${agentId}`.substring(0, 50);

    return this.circuitBreaker.execute(
      operationKey,
      async () => {
        if (!this.actionChain || !this.llm) {
          this.logger.error(`[${agentId}] LLM Action Chain or LLM not initialized.`);
          return { type: 'no_action', payload: { reason: 'LLM Service not initialized' } };
        }

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
                const content =
                  typeof p.content === 'string' ? p.content : JSON.stringify(p.content);
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

        this.logger.verbose(`[${agentId}] Invoking LLM action chain (via circuit breaker)...`);

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
      },
      async () => {
        this.logger.warn(`[${agentId}] Fallback used for generateAction.`);
        return { type: 'no_action', payload: { reason: 'LLM Circuit Open or Failed' } };
      },
    );
  }

  /**
   * Decomposes a high-level goal into a hierarchical plan (HTN).
   */
  async generatePlanSteps(
    agentId: string,
    goal: string,
    context: OrientationContext,
  ): Promise<AgentPlan> {
    this.logger.debug(`[${agentId}] LLM generatePlanSteps called for goal: "${goal}"`);

    if (!this.llm) {
      this.logger.error(`[${agentId}] LLM not initialized for plan generation.`);
      // Return a minimal empty plan on error
      return {
        planId: uuid(),
        goal,
        rootNodeId: '',
        nodes: {},
        creationTimestamp: Date.now(),
        status: 'failed',
      };
    }

    const operationKey = `llm_generatePlanSteps_${agentId}`.substring(0, 50);
    const fallbackSteps = [
      {
        id: uuid(),
        description: `address the goal: ${goal}`,
        taskType: 'primitive',
        status: 'pending',
      },
    ];

    return this.circuitBreaker.execute(
      operationKey,
      async () => {
        // Define a schema for the LLM to output a structured plan
        const LlmPlanOutputSchema = z.object({
          rootGoal: z.string(),
          steps: z.array(
            z.object({
              id: z.string().describe('A unique temporary ID for this step, e.g., step_1'),
              description: z.string(),
              taskType: z
                .enum(['primitive', 'compound'])
                .describe(
                  'Is this step directly actionable (primitive) or needs more breakdown (compound)?',
                ),
              parentId: z
                .string()
                .optional()
                .describe('The temporary ID of the parent step, if any.'),
            }),
          ),
        });

        const outputParser = new JsonOutputParser<z.infer<typeof LlmPlanOutputSchema>>();

        // Get JSON schema for output formatting
        const formatInstructions = this.getFormatInstructions(LlmPlanOutputSchema);

        // Create a specific prompt for goal decomposition with structured output
        const planningPrompt = ChatPromptTemplate.fromMessages([
          [
            'system',
            `You are a hierarchical planner. Decompose the given goal into a sequence of steps.
Assign a unique temporary id (e.g., step_1, step_2a) to each step.
Indicate the parentId for sub-steps.
Mark each step as 'primitive' (directly actionable) or 'compound' (requires further decomposition).

Current agent mood: {mood}
Agent identity: {persona}
Current situation: {context_summary}

${formatInstructions}`,
          ],
          ['human', 'Goal: {goal}'],
        ]);

        // Create the planning chain with structured output
        const planningChain = planningPrompt.pipe(this.llm!).pipe(outputParser);

        // Prepare context summary for prompt
        const contextSummary = this.summarizeContext(context);

        // Prepare inputs for the planning chain
        const planningInput = {
          goal: goal,
          persona: context.agentSelfConcept?.role.primaryRole || 'a character', // Use role
          mood: context.dynamicState?.mood || 'neutral',
          context_summary: contextSummary,
        };

        this.logger.verbose(`[${agentId}] Invoking planning chain (via circuit breaker)...`);

        // Execute the planning chain
        const result = await planningChain.invoke(planningInput);
        const llmSteps = result.steps;

        const planId = uuid();
        const nodes: AgentPlan['nodes'] = {};
        let rootNodeId = '';

        // Map LLM temporary IDs to final UUIDs and create PlanNode objects
        const tempIdToUuidMap = new Map<string, string>();
        llmSteps.forEach((stepData) => {
          const nodeId = uuid();
          tempIdToUuidMap.set(stepData.id, nodeId);

          const node: z.infer<typeof PlanNodeSchema> = {
            id: nodeId,
            description: stepData.description,
            status: 'pending',
            taskType: stepData.taskType,
            parentId: undefined, // Set in the next loop
          };
          nodes[nodeId] = node;
        });

        // Second pass: Link parent IDs using the UUID map and find root
        llmSteps.forEach((stepData) => {
          const childUuid = tempIdToUuidMap.get(stepData.id);
          if (!childUuid) {
            this.logger.error(`[${agentId}] Failed to find UUID for temp step ID: ${stepData.id}`);
            return; // Skip this step if UUID mapping failed
          }
          if (stepData.parentId) {
            const parentUuid = tempIdToUuidMap.get(stepData.parentId);
            if (parentUuid && nodes[childUuid]) {
              nodes[childUuid].parentId = parentUuid;
            } else {
              this.logger.warn(
                `[${agentId}] Could not map parentId ${stepData.parentId} for step ${stepData.id}`,
              );
              // If parent doesn't exist, treat as root for now
              rootNodeId = !rootNodeId ? childUuid : rootNodeId;
            }
          } else {
            // No parent ID means it's potentially a root node
            rootNodeId = !rootNodeId ? childUuid : rootNodeId; // Assign first root found
          }
        });

        // Ensure a root node ID is assigned (fallback to first node if hierarchy is flat/broken)
        if (!rootNodeId && Object.keys(nodes).length > 0) {
          rootNodeId = Object.keys(nodes)[0]!; // Re-add ! assertion for type safety
        }

        const agentPlan: AgentPlan = {
          planId,
          goal: result.rootGoal || goal, // Use goal from LLM or original
          rootNodeId,
          nodes,
          creationTimestamp: Date.now(),
          status: 'active',
        };

        this.logger.verbose(
          `[${agentId}] LLM generated plan ${planId} with ${Object.keys(nodes).length} nodes.`,
        );
        return agentPlan;
      },
      // Fallback function
      async () => {
        this.logger.warn(`[${agentId}] Fallback used for generatePlanSteps.`);
        return {
          planId: uuid(),
          goal,
          rootNodeId: '',
          nodes: {},
          creationTimestamp: Date.now(),
          status: 'failed',
        };
      },
    );
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

  /**
   * Analyzes recent experiences to generate higher-level insights for reflection.
   */
  async analyzeExperiencesForInsights(
    agentId: string,
    observations: Observation[],
  ): Promise<ReflectionReport['insights']> {
    this.logger.debug(
      `[${agentId}] LLM Service: analyzeExperiencesForInsights called for ${observations.length} observations.`,
    );

    // Construct prompt with observations, ask LLM to identify patterns, learnings, etc.
    // Parse LLM response into the structured ReflectionReport['insights'] format.

    const operationKey = `llm_analyzeInsights_${agentId}`.substring(0, 50);

    return this.circuitBreaker.execute(
      operationKey,
      async () => {
        if (observations.length === 0) {
          return [];
        }

        if (!this.llm) {
          this.logger.error(`[${agentId}] LLM not initialized for insight generation.`);
          return []; // Cannot generate if LLM is down
        }

        // Define the desired output structure (just the insights part of the report)
        const InsightSchema = ReflectionReportSchema.shape.insights.element;
        const InsightsListSchema = z.object({
          insights: z.array(InsightSchema),
        });

        const outputParser = new JsonOutputParser<z.infer<typeof InsightsListSchema>>();
        const formatInstructions = this.getFormatInstructions(InsightsListSchema);

        // Prepare a summary of observations for the prompt
        const observationSummary = observations
          .slice(-10) // Limit context size
          .map((obs) => `[${new Date(obs.timestamp).toISOString()}] ${obs.content}`)
          .join('\n');

        const prompt = ChatPromptTemplate.fromMessages([
          [
            'system',
            `You are a reflective assistant analyzing an agent's recent experiences.
             Identify 1-3 key insights, patterns, or learnings from the provided observations.
             Categorize each insight (self, world, social, goal, learning, other) and estimate confidence.
             Reference supporting observation IDs if applicable.

             ${formatInstructions}`,
          ],
          ['human', `Recent Observations:\n---\n${observationSummary}\n---\nInsights:`],
        ]);

        const chain = prompt.pipe(this.llm).pipe(outputParser);

        this.logger.verbose(
          `[${agentId}] Invoking insight generation chain (via circuit breaker)...`,
        );
        const result = await chain.invoke({}); // No specific input variables beyond prompt content

        this.logger.verbose(
          `[${agentId}] Insight generation complete, ${result.insights.length} insights found.`,
        );
        return result.insights;
      },
      async () => {
        this.logger.warn(`[${agentId}] Fallback used for analyzeExperiencesForInsights.`);
        return []; // Return empty array on failure/circuit open
      },
    );
  }

  // TODO: Implement other LLM methods
}
