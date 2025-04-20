# PixelTales Agent Architecture Blueprint (v1.0)

## 1. Introduction: The Agent-Centric Vision

This document outlines the agent-centric architecture designed for PixelTales. Moving beyond a simple request-response model, this architecture treats each character as an autonomous `Agent` entity. The goal is to simulate more realistic and dynamic interactions where agents perceive their environment, maintain internal state and memory, make decisions based on their personality and context, and act upon the shared world. This approach aligns with modern multi-agent system research, emphasizing autonomy, perception, memory, and structured reasoning.

Central to this design is the principle of **strict typing and structured data flow**. All significant internal states, decisions, actions, and communication events are represented by well-defined Zod schemas located in `packages/contracts`, ensuring predictability, observability, and integration with UI features.

## 2. The `Agent`: Core Autonomous Entity

Each character participating in a scene is represented by an instance of the `Agent` (likely implemented as a NestJS service instance or managed class). The `Agent` is the primary locus of state, perception, cognition, and action.

The following diagram illustrates the flow of information and decision-making within a single agent, drawing parallels to human cognitive processes:

```text
        +----------------------------------------------------------------------------+
        |                      Agent's Mind (Mimicking Human)                        |
        +----------------------------------------------------------------------------+
              ^                                                                  |
              | Perception Events (Anonymized Sight/Sound)                       | Action (Speech/Movement)
              | from ConversationManager (Environment)                           | to ConversationManager (Environment)
              |                                                                  v
 +----------------------------+      +-------------------------+      +--------------------------+
 |   Perception System        |----->|   Cognitive Cycle       |----->|     Action System        |
 | (Filtering Senses)         |      | (Thinking & Deciding)   |      | (Executing Decisions)    |
 |                            |      |                         |      |                          |
 |  - Event Filtering         |      |  1. Orient (Context)    |      |  - Format Final Action   |
 |  - Working Memory Update   |      |  2. Decide (Goal)       |      |    (Speak, Use Tool etc) |
 +----------------------------+      |  3. Plan   (Steps)      |      +--------------------------+
                                     |                         |                 ^
                                     |  4. Act (Execute Plan)  |-----------------|
                                     +------------^------------+
                                                  |
                                                  | Tool Calls / State Updates
                                                  v
                       +------------------------------------------------+
                       | Internal State & Memory System (Mind's Storage)|
                       +------------------------------------------------+
                       | - Dynamic State (Mood, Interest, Goals)        |
                       | - Working Memory (Short-term Buffer)           |
                       | - Episodic Memory (Experiences Log)            |
                       | - Semantic Memory (Facts, Knowledge, Beliefs)  |
                       | - Social Memory (Understanding of Others)      |
                       +------------------------------------------------+
```

### 2.0. "Agent's Mind" – A Unifying View

While the following subsections (Perception, Memory, Cognitive Cycle, Action System, Toolbelt) break down the internals into discrete responsibilities, it helps to keep a *holistic* mental model: **the Agent's Mind**.

```text
┌───────────────────────────────────────────────┐
│                Agent's Mind                   │
│            (Private, Encapsulated)            │
├───────────────────────────────────────────────┤
│  Perception  ──► Working Memory ◄───┐         │
│                                     ▼         │
│      ┌───────────── System‑1 (Fast) ─────────┐│
│      │   Rapid, intuitive reactions          ││
│      └──────────────┬────────────────────────┘│
│                     │                         │
│      ┌───────────── System‑2 (Slow) ─────────┐│
│      │   Deliberate reasoning & planning     ││
│      └──────────────┴────────────────────────┘│
│               ▲           │                   │
│               │           │                   │
│   Dynamic & Semantic      │                   │
│        Memory             │                   │
│               └──── Planner/Executor ◄────────┘
│                               │  AgentAction  │
└───────────────────────────────┴───────────────┘
```

* **System‑1** – Fast, heuristic reactions (e.g., quick back‑channel responses like "😊" or short interjections). Runs whenever *low mental effort* is enough. Implemented as a lightweight LangChain Runnable that uses *minimal* context (last message, mood).
* **System‑2** – Slow, analytical reasoning. Activated when:
    * The agent is *addressed directly*.
    * A goal in `shortTermGoals` requires structured thought.
    * Conversation rating drops below a threshold (needs effort to improve).
    * "Idle reflection" timer fires.
* **Planner/Executor** – Shares data with System‑2 and produces **Hierarchical Task Networks (HTN)** for multi‑step goals. Plans are stored in memory as `PlanNode` objects (Zod schema) and executed over multiple Cognitive Cycles.

### 2.1. Internal State (Private & Encapsulated)

The agent's internal state is private and not directly accessible by other agents **or the environment**. Fields are tagged to indicate who/what may legitimately mutate them:

| Field                                | Mutated by                             | Notes                                 |
|--------------------------------------|----------------------------------------|---------------------------------------|
| `agentId` (string)                   | **external** (`AgentFactory`)          | Immutable identity                    |
| `config.llmConfig`                   | **external** (`SceneManager` on spawn) | Static                                |
| `config.personalityCore`             | **external** (spawn)                   | Static, but may *grow* by agent through *self‑reflection* (opt‑in) |
| `config.visualDescription`           | **external** (`SceneManager`)          | Static                                |
| `dynamicState.mood`                  | **agent** *and* **System‑1**           | Updated after each turn               |
| `dynamicState.participationInterest` | **agent**                              | Computed from mood, context relevance |
| `dynamicState.currentFocus`          | **agent**                              | Cleared when focus changes            |
| `dynamicState.shortTermGoals`        | **agent** *and* **Planner**            | Planner may push/pop goals            |

*External* mutations originate from higher‑level orchestration (e.g., a new scene). Everything else is purely the agent's internal decision.

### 2.2. Perception System: The Agent's Senses

Mimicking sensory input, the Perception System is how the agent receives information about the external world (the scene and other agents).

* **Input:** Receives a stream of anonymized, typed events (`AgentPerceptionEvent`) from the `ConversationManager`. Examples:
    * `MessageBroadcastEvent`: `{ type: 'message', visualId: string, content: string, timestamp: number }`
    * `AgentEnteredEvent`: `{ type: 'enter', visualId: string, visualDescription: string, timestamp: number }`
    * `AgentLeftEvent`: `{ type: 'leave', visualId: string, timestamp: number }`
    * `SceneUpdateEvent`: `{ type: 'scene_update', description: string, timestamp: number }`
* **Anonymity:** Crucially, the agent only perceives the temporary `visualId` associated with other agents' appearances, not their internal `agentId` or private state. Knowledge about others must be inferred and stored in memory.
* **Processing:** Filters events based on relevance (e.g., proximity, direct address) and updates the agent's `workingMemory`. High-priority events can trigger the Cognitive Cycle directly.

### 2.3. Memory System: Storing and Recalling Experiences

The agent relies on different memory types, managed by the `MemoryService` and accessed via strictly typed tool calls through its `memoryInterface`. This mirrors human cognitive models.

* **Working Memory (Internal):** A small, volatile buffer holding the most recent perceptions and intermediate thoughts during a cognitive cycle. Not persistent.
* **Episodic Memory (Persistent):** A chronological log of observations and experiences. Accessed via tools like:
    * `addObservation(timestamp, content, associatedVisualIds)`
    * `retrieveObservations(query, timeFilter, visualIdFilter)` -> Returns `Observation[]`
* **Semantic Memory (Persistent):** Stores distilled facts, knowledge, and beliefs extracted from experiences or reflection. Often involves vector embeddings for relevant retrieval. Accessed via tools like:
    * `upsertFact(subjectVisualId, key, value, confidence)`
    * `retrieveFacts(subjectVisualId, query)` -> Returns `Fact[]`
* **Social Memory (Implicit within Semantic):** Represents the agent's understanding of other agents (`visualId`s). Stored as facts in Semantic Memory (e.g., "visualId_xyz name is Jane", "visualId_abc seems friendly"). Accessed via fact retrieval tools targeting specific `visualId`s.

### 2.3.1 Memory Utilization in the Cognitive Cycle

* During **Observe** and **Orient**, the Agent invokes `memoryInterface.retrieveObservations()` and `retrieveFacts()` to fetch relevant episodic and semantic memories, enriching context with past experiences.
* In the **Decide & Plan** phase, retrieved memories guide goal selection, inform HTN planning with prior outcomes, and seed reflection tasks when goals stall.
* After **Act**, new observations and inferred facts are persisted using `memoryInterface.addObservation()` and `memoryInterface.upsertFact()`, ensuring the episodic log and semantic base evolve.
* Social memory calls (`retrieveFacts(visualId, ...)`) help the Agent track other characters' personalities and relationships, shaping future interaction strategies.

### 2.4. Cognitive Cycle: The Agent's Thought Process

This is the core loop where the agent interleaves fast reactions, deliberative reasoning, and online learning to produce intelligent behavior. It is an enhanced version of the decision-making model "OODA loop" (Observe, Orient, Decide, Act).

1. **Observe:**
   * PerceptionService emits typed `AgentPerceptionEvent`s (e.g., messages, enters, leaves, scene updates).
   * Agent filters events by relevance, updates `workingMemory` buffer with recent context.
   * High-priority events are logged to EpisodicMemory via `memoryInterface.addObservation(timestamp, content, visualIds)`.

2. **Orient:**
   * Agent retrieves past experiences with `memoryInterface.retrieveObservations(query, timeFilter)` and semantic facts with `memoryInterface.retrieveFacts(subjectVisualId, query)`.
   * Constructs an `OrientationContextSchema` containing:
     * DynamicState (`mood`, `interest`, `focus`)
     * Last N messages from ConversationHistory
     * Relevant Episodic and Semantic memory entries
     * Active `shortTermGoals`
   * Evaluates whether any goals require immediate attention (e.g., endConversation signals).

3. **Decide & Plan:**
   * Ranks `dynamicState.shortTermGoals` via a UtilityFunction (e.g., urgency, novelty, sentiment).
   * For complex goals, invokes `PlannerService.generatePlan(goal, OrientationContextSchema)` to build an HTN `PlanNode` tree.
   * Persists the plan in EpisodicMemory and selects the next actionable leaf node as the immediate subtask.

4. **Act (Execute):**
   * Executes the selected plan leaf:
     * **Speak:** Assembles system + user messages + plan instructions and calls `LlmService.generateResponse()`.
     * **Use Tool:** Invokes the appropriate tool through `toolbelt.call(toolName, params)` (memory read/write, datetime, endConversation).
   * Parses the structured LLM output into an `AgentAction` and sends it to the ConversationManager.
   * Updates the world and internal state:
     * `sceneStateService.addMessageToState()` and `sceneStateService.updateCharacterState()`
     * Records new observations and inferred facts via `memoryInterface.addObservation()` and `memoryInterface.upsertFact()`.

5. **Learn & Adapt:**
   * Computes a scalar `rewardScore = RewardFunction.compute(conversationRating, goalProgress, userFeedback)`.
   * Records the tuple `(stateSnapshot, agentAction, rewardScore)` using `learningInterface.recordReward()`.
   * The LearningModule periodically:
     * **Policy Updates:** Refines HTN planner weights, reprioritizes `shortTermGoals`, and adjusts `personalityCore` embeddings via bandit or policy gradient methods.
     * **Meta-Learning:** Compresses episodic logs, prunes low-signal memories, and recalibrates semantic embeddings for efficient retrieval.
   * Updated policies and embeddings influence future cycles immediately, closing the learning loop.

**Enhanced Planning (HTN-based)**

During *Decide & Plan* the agent uses a **Hierarchical Task Network**: a recursive structure where high-level goals decompose into sub-tasks with ordering constraints. The planner is implemented with a custom LangChain `RunnableSequence` that:
1. Reads the *top* goal in `shortTermGoals`.
2. Queries `Semantic Memory` for relevant facts, and LLM for domain knowledge.
3. Generates a **`PlanNode`** tree (schema: `{id, parentId?, description, status<'pending'|'done'>, toolCall?}`).
4. Stores the tree in Episodic Memory for traceability.
5. Returns the *next actionable leaf* for execution.

At each subsequent cycle, executed leaf nodes are marked `done`. If a parent node has all children `done`, it is auto-completed, propagating upward. This mechanism supports multi-step reasoning without exceeding LLM context windows.

**Reflection – Borrowing from *Thinking, Fast & Slow***

Every N cycles (or when idle), the agent launches a *Reflection Runnable* (System-2) that:
* Summarises recent episodic events.
* Updates semantic memory with new inferred facts.
* Adjusts `mood` and `participationInterest` based on long-term trajectory.

Reflection output conforms to `ReflectionReportSchema`, logged for UI inspection.

### 2.5. State Management: Moods and Motivations

The `dynamicState` is not static. It's updated during the Cognitive Cycle based on perceptions and actions, influencing future decisions.

* Mood (`mood`) can shift based on conversation tone (`reactionOnPreviousMessage`, `conversationRating` from `CharacterResponseSchema`) or goal fulfillment.
* Interest (`participationInterest`) can increase if the topic is relevant or decrease if bored or disengaged.
* Focus (`currentFocus`) changes based on who the agent is interacting with.

### 2.6. Action System: Executing Decisions

The agent interacts with the world by producing a typed `AgentAction` object at the end of its Cognitive Cycle. This action is sent to the `ConversationManager`.

* **Types:** Defined by `AgentActionSchema` (discriminated union):
    * `speak`: Contains the detailed `CharacterResponseSchema` payload.
    * `use_tool`: Specifies the tool and input (used internally during the cycle, but could also be an external action like interacting with a scene object).
    * `update_state`: Represents an internal decision to change mood, focus, etc.
    * `no_action`: Explicitly indicates the agent chose not to act, potentially with a reason.
* **Structured Output:** Ensures the `ConversationManager` and frontend receive predictable information about the agent's behavior.

### 2.7. Toolbelt: Extending Capabilities

Tools are functions the agent can invoke during its Cognitive Cycle (primarily in the Act phase) to gather information or affect its memory/state.

* **Interface:** Defined by strict input/output schemas (`ToolCallRequestSchema`, `ToolCallResultSchema`).
* **Examples:** Accessing different memory types, getting current datetime, requesting scene information, potentially interacting with scene objects in the future.
* **Invocation:** Triggered explicitly by the agent's plan or implicitly requested within an LLM response (parsed and executed).

### 2.8 Learning & Adaptation Foundation

* **RewardFunction:** Encapsulates the computation of scalar reward signals from conversation metrics, user ratings, and goal progress.
* **LearningModule:** Listens to `recordReward` calls and accumulates experiences in episodic memory, orchestrating online/offline learning loops to refine planning and decision-making.
* **PolicyUpdate:** Scheduled tasks that fine-tune HTN planner weights, reprioritize goals, and adapt `personalityCore` parameters based on recent feedback.
* **MetaLearning:** Periodic routines that compress memory traces, prune low-signal data, and update semantic vector stores for efficient context retrieval.

## 3. Interaction Model: The Social Environment

Agents do not communicate directly. They interact asynchronously through the `ConversationManager`, which acts as the environment and event bus.

* Agents emit `AgentAction` objects.
* `ConversationManager` processes these actions and broadcasts corresponding anonymized `AgentPerceptionEvent`s to all *other* present agents.
* This indirect model forces agents to rely on perception and memory to build their understanding of the world and others.

## 4. Key Data Structures (`packages/contracts`)

The reliability of this architecture hinges on shared, strictly typed data structures defined using Zod:

* `AgentActionSchema`: Defines the possible outputs of an agent's cycle.
* `CharacterResponseSchema`: Detailed structure for spoken output and immediate reactions.
* `AgentPerceptionEventSchema`: Union of all possible events an agent can perceive.
* `Tool Schemas`: Specific schemas for input/output of each available tool (e.g., `MemoryQuerySchema`, `FactSchema`, `ObservationSchema`).
* `AgentDynamicStateSchema`: Defines the mutable internal state.
* `AgentPlanSchema`, `OrientationContextSchema`: (Optional but recommended) Schemas for internal cognitive steps.

## 5. Future Directions

This architecture provides a foundation for more advanced AI behaviors:

* **Sophisticated Planning:** Implemented via HTN planner and `PlanNode` trees; next steps include real-time re-planning and fallback strategies on plan failure.
* **Reflection:** The periodic **Reflection Runnable** summarizes recent episodic events, updates semantic memory, and tunes `personalityCore` over time.
* **Learning & Adaptation:** Agents will integrate reward functions—metrics such as engagement score, conversation rating, or user feedback—to perform fine-grained policy updates via reinforcement or bandit algorithms.
* **Personalization & Reward Modeling:** Extend the `personalityCore` with user-specific preferences and A/B test outcomes, influencing tone, style, and topic bias for each Agent.
* **Continual & Lifelong Learning:** Incorporate meta-learning layers that update semantic embeddings incrementally, with memory compression and pruning strategies for scalable, long-term contexts.
* **Goal-Driven Behavior:** Elevate `shortTermGoals` into composite, long-horizon objectives managed by a **GoalManager**, integrating planning, monitoring, and adaptive re-prioritization.

## 6. Legacy Application Integration

### 6.1 Adaptable Components

* **SceneManagerService**: serves as the core environment manager and scheduler, mapping to the new `ConversationManager` (perception bus + loop controller).
* **ConversationOrchestratorService**: foundation for the enhanced Cognitive Cycle orchestrator (Observe→Orient→Decide→Act→Learn).
* **MessageGenerationService**: existing LLM wrapper for Think & Speak phases, ready to evolve into `ToolCall`–driven action routines.
* **ConversationStateService**: goal selection and turn‑taking logic, fitting the new Decision & Plan phase.
* **SceneStateService & ScenesDbService**: low‑level state snapshot and persistence layers, adaptable to the MemorySystem's episodic store.
* **MessagesDbService**: persistent journal of messages, can underpin reward logging and experience replay.
* **LlmService**: core GPT gateway, extendable for structured prompts, streaming, and new drivers.

### 6.2 Crucial Integration Interfaces

* **IMemoryInterface**
    * `addObservation(timestamp, content, visualIds)`
    * `retrieveObservations(query, timeFilter, visualIdFilter)`
    * `upsertFact(subjectVisualId, key, value, confidence)`
    * `retrieveFacts(subjectVisualId, query)`
* **ILearningInterface**
    * `recordReward(stateSnapshot, agentAction, rewardScore)`
    * `getExperienceBatch(batchSize, criteria)`
* **IToolbelt**
    * `call(toolName: string, params: any): Promise<any>` for memory, datetime, conversation control tools.
* **IPlannerService**
    * `generatePlan(goal: Goal, context: OrientationContextSchema): PlanNode[]`
* **IRewardFunction**
    * `compute(conversationRating: number, goalProgress: number, feedback?: any): number`
* **ISceneStateService**
    * `getCurrentState(): SceneStateSnapshot`
    * `updateState(updates: Partial<SceneState>): Promise<void>`
    * `addMessageToState(message: Message): Promise<void>`
    * `updateCharacterState(charId: string, updates: Partial<CharacterState>): Promise<void>`
* **IEventBus**
    * Listens to events like `scene.state.updated` and `agent.action.emitted` to drive perceptions.

### 6.3 Proposed File Structure

```text
apps/backend/src/
  core/
    event-bus.interface.ts      # IEventBus + EventBusService
    config.service.ts          # Global config loader
  agent/
    agent.module.ts            # Aggregates agent services
    agent.service.ts           # Agent lifecycle & factory
    agent.factory.ts           # Spawns new Agent instances
    agent.state.ts             # Agent runtime state definitions
    memory/
      memory.module.ts         # MemoryService imports
      memory.interface.ts      # IMemoryInterface
      episodic-memory.service.ts # Implements add/retrieveObservations
      semantic-memory.service.ts # Implements upsert/retrieveFacts
    planner/
      planner.module.ts        # PlannerService imports
      planner.interface.ts     # IPlannerService
      htn-planner.service.ts   # HTN planning implementation
    learning/
      learning.module.ts       # LearningService imports
      learning.interface.ts    # ILearningInterface
      learning.service.ts      # Reward recording & policy updates
    toolbelt/
      toolbelt.module.ts       # ToolbeltService imports
      toolbelt.service.ts      # IToolbelt implementer
      datetime.tool.ts         # datetime tool
      memory.tool.ts           # memory read/write tool
      end-conversation.tool.ts # conversation control tool
    orchestrator/
      orchestrator.module.ts   # Orchestrator imports
      orchestrator.service.ts  # Cognitive Cycle coordination
packages/contracts/
  agent/
    AgentAction.ts             # Zod schema for agent actions
    CharacterResponse.ts       # Zod schema for character responses
    AgentPerceptionEvent.ts    # Zod schema for perception events
    MemorySchemas.ts           # Zod schemas for Observation/Fact
    PlanNode.ts                # Zod schema for HTN plan nodes
    stats.ts                  # Stats type definitions
frontend/                    # Unchanged
```

## 7. Statistics & Logging Concept

Real‑time and historical telemetry are core to PixelTales—detailed stats validate agent behavior, reveal insights, and drive continuous improvement.

### 7.1 Key Metrics

* **Conversation-Level**
    * Total messages, duration, tokens used, cost
    * Average response time, idle time, pause overhead
    * Conversation rating over time (per message)
* **Agent-Level**
    * Messages sent, message types (speak/tool)
    * Response times: think vs. speak durations
    * Mood & participation interest curves
    * Short‑term goals created vs. completed
    * HTN plan sizes (nodes, depth)
    * Memory operations: reads, writes, retrieval latency
    * Reward signals: per‑turn rewards, cumulative reward
* **System-Level**
    * LLM API latency & error rates
    * Tool invocation counts and success rates
    * Event bus throughput (events/sec)
    * Memory service load (requests/sec)

### 7.2 Instrumentation & Data Flow

```text
[Agent] ──(AgentAction emitted)──> [EventBus] ──┐
                                              └──> [StatsCollector] ──> [TimeSeriesDB]
[Orchestrator] ──(StepTiming)─┐
                              └──> [EventBus]
[MemoryService] ──(obs logged)─> [EventBus]
[LearningModule] ──(reward logged)─> [StatsCollector]

EventBus listeners push JSON events:
{
  event: 'agent.action',
  agentId: 'Alice',
  type: 'speak',
  durationMs: 45000,
  timestamp: 1679950000000,
}
```

### 7.2.1 Real‑Time Statistics Architecture

To collect, process, and display live metrics, PixelTales uses an event-driven, scalable pipeline:

* **Publisher-Subscriber Pattern** via `EventBusService`:
    * `EventBusService.publish(eventType: string, payload: any)`: broadcast JSON events.
    * `EventBusService.subscribe(eventType: string, handler: (payload) => void)`: register listeners.
    * Enables loose coupling between producers (Agent, Orchestrator, MemoryService, LearningModule) and consumers (StatsCollectorService).

* **Observer Pattern** in `StatsCollectorService`:
    * `StatsCollectorService` implements `IEventBusListener` and registers to key events:
        * `agent.action` → `handleAgentAction(payload: AgentActionEvent)`
        * `orchestrator.stepCompleted` → `handleStepTiming(payload: StepTimingEvent)`
        * `memory.logged` → `handleMemoryEvent(payload: MemoryEvent)`
        * `learning.reward` → `handleRewardEvent(payload: RewardEvent)`
    * Methods parse payloads into internal `Metric` objects and forward to storage adapters.

* **Adapter Pattern** for storage backends:
    * `TimeSeriesAdapter` implements `IMetricsAdapter`:
        * `writePoint(metric: Metric): Promise<void>` pushes to TimeSeriesDB (e.g., InfluxDB).
    * `OLAPAdapter` implements `IMetricsAdapter`:
        * `batchInsert(metrics: Metric[]): Promise<void>` writes aggregated data to OLAP store (ClickHouse).
    * Allows switching or combining backends without changing the collector logic.

* **Strategy Pattern** for metric formatting:
    * `MetricFormatter` interface with methods:
        * `formatAgentMetric(event: AgentActionEvent): Metric`
        * `formatSystemMetric(event: SystemEvent): Metric`
    * Concrete formatters (`AgentMetricFormatter`, `SystemMetricFormatter`) convert raw events into uniform `Metric` schema.

* **Circuit Breaker** for resilient LLM and tool metrics:
    * `CircuitBreakerService.monitor(providerName: string, fn: () => Promise<any>)` wraps LLM API calls.
    * Emits `provider.error` and `provider.latency` events on failures or slow responses.

* **Key Classes & Methods**:

  ```ts
  class EventBusService {
    publish(eventType: string, payload: any): void { /* ... */ }
    subscribe(eventType: string, handler: (payload: any)=>void): void { /* ... */ }
  }

  class StatsCollectorService {
    constructor(private readonly bus: EventBusService,
                private readonly adapters: IMetricsAdapter[],
                private readonly formatter: MetricFormatter) {}

    init() {
      this.bus.subscribe('agent.action', this.handleAgentAction.bind(this));
      // ... other subscriptions
    }

    async handleAgentAction(evt: AgentActionEvent) {
      const metric = this.formatter.formatAgentMetric(evt);
      await Promise.all(this.adapters.map(a => a.writePoint(metric)));
    }

    async handleStepTiming(evt: StepTimingEvent) { /* similar */ }
    async handleMemoryEvent(evt: MemoryEvent) { /* ... */ }
    async handleRewardEvent(evt: RewardEvent) { /* ... */ }
  }

  interface IMetricsAdapter {
    writePoint(metric: Metric): Promise<void>;
  }

  class TimeSeriesAdapter implements IMetricsAdapter {
    writePoint(metric: Metric) { /* push to InfluxDB */ }
  }
  ```

This modular, pattern-based design ensures high throughput, resilience under load, and flexibility to add new metrics or storage backends.

### 7.2.2 Stats Type Definitions (TypeScript & Zod)

Define event payloads for strict typing

```ts
// packages/contracts/agent/stats.ts
import { z } from 'zod';

// Agent Action Event
export const AgentActionEventSchema = z.object({
  eventType: z.literal('agent.action'),
  conversationId: z.string(),
  agentId: z.string(),
  actionType: z.enum(['speak', 'think', 'tool', 'idle']),
  durationMs: z.number(),
  timestamp: z.number(),
});
export type AgentActionEvent = z.infer<typeof AgentActionEventSchema>;

// Orchestrator Step Timing Event
export const StepTimingEventSchema = z.object({
  eventType: z.literal('orchestrator.stepCompleted'),
  conversationId: z.string(),
  stepName: z.string(),
  elapsedMs: z.number(),
  timestamp: z.number(),
});
export type StepTimingEvent = z.infer<typeof StepTimingEventSchema>;

// Memory Operation Event
export const MemoryEventSchema = z.object({
  eventType: z.literal('memory.logged'),
  conversationId: z.string(),
  type: z.enum(['observation', 'fact']),
  subjectVisualId: z.string().optional(),
  key: z.string(),
  latencyMs: z.number(),
  timestamp: z.number(),
});
export type MemoryEvent = z.infer<typeof MemoryEventSchema>;

// Learning Reward Event
export const RewardEventSchema = z.object({
  eventType: z.literal('learning.reward'),
  conversationId: z.string(),
  agentId: z.string(),
  rewardScore: z.number(),
  timestamp: z.number(),
});
export type RewardEvent = z.infer<typeof RewardEventSchema>;

// Unified Metric type for storage adapters
export const MetricSchema = z.object({
  name: z.string(),
  tags: z.record(z.string(), z.string()),
  fields: z.record(z.string(), z.number()),
  timestamp: z.number(),
});
export type Metric = z.infer<typeof MetricSchema>;
```

This ensures all stats events and metrics are strictly typed, validated at runtime via Zod, and shared across services.

### 7.3 Logging & Storage

* **Structured logs** (Pino/JSON) with traceId and correlationId in each event
* **TimeSeriesDB** (e.g. InfluxDB, Prometheus remote) for high‑frequency metrics
* **OLAP store** (e.g. ClickHouse) for aggregated analytics and ad‑hoc queries
* **Archive logs** for audit and compliance

### 7.4 Dashboard & UX Mockup

```text
+---------------------------------------------------------------------------------+
| PixelTales Dashboard                                                            |
|---------------------------------------------------------------------------------|
| [Scene View]                | [Stats Panel]                                |
|  ┌───────────────┐         |  ┌─────────────┐  ┌─────────────┐  ┌───────┐ |
|  |   Phaser 3    |         |  | Agent: Alice|  | Agent: Bob  |  |Summary| |
|  |  Scene Render |         |  | msgs: 87    |  | msgs: 91    |  |msgs:178| |
|  └───────────────┘         |  | avg RT:45s |  | avg RT:46s  |  | cost: $X| |
|                            |  └─────────────┘  └─────────────┘  └───────┘ |
|                            |  [Line Chart: Response Time over time]     |
|                            |  [Bar Chart: Memory Reads vs Writes]       |
|                            |  [Heatmap: Mood Trajectory]               |
|                            |                                           |
|                            | Live / History toggle, filters, export    |
+---------------------------------------------------------------------------------+
```

* **Real‑Time View**: streaming charts, live stats updates
* **History Mode**: scrub timeline, replay events, annotate anomalies
* **Agent Drill‑Down**: click into agent card to see HTN plans, memory logs, reward history

### 7.5 UX Considerations

* **Performance**: lazy load heavy charts, paginate logs
* **Clarity**: consistent color‑coding per agent, clear legends
* **Accessibility**: keyboard navigation, screen‑reader labels on charts
* **Export**: CSV/JSON dump for external analysis

# End of Agent Architecture Blueprint
