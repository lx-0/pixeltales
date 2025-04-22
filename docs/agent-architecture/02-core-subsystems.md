# 2. Core Subsystems

## 2.1 The `Agent`: Core Autonomous Entity

Each character participating in a scene is represented by an instance of the `Agent` (likely implemented as a NestJS service instance or managed class). The `Agent` is the primary locus of state, perception, cognition, and action.

The following diagram illustrates the flow of information and decision-making within a single agent, drawing parallels to human cognitive processes:

```diagram/text
+------------------------------------------------------------------------------------------------------------------------------------------+
|                              AGENT'S MIND (ENTIRE COGNITIVE ARCHITECTURE)                                                                |
+------------------------------------------------------------------------------------------------------------------------------------------+
|                                                                                                                                          |
|       Environmental Events (Perceived via Vision/Audio/Other Sensors)                                                                    │
|                          +---------------------------------------------------------------------------------------------------------------┼---+
|                          v                                                                                                               |   |    Agent Actions
| +--------------------------+         +-----------------------------+         +--------------------------+  +---------------------------+ |   |    (Executed via
| | Perception System (2.2)  |--------►|   Cognitive Cycle (2.3)     |--------►| Action System (2.5)      |--| Capability Extensions     |─┼-------+  Speech/Motion...)
| | (Filtering Senses)       |         | (Thinking & Deciding)       |         | (Formatting Decisions)   |  | (2.6)                     | |   |   v
| |                          |         |                             |         |                          |  |                           | |  +------------------------+
| | • Vision Processing      |         | ┌─────────────────────────┐ |         | • Format Action Intent   |  | • Speech Output           | |  | Environment Simulation |
| | • Audio Processing       |         | │ System-1 (Fast, 2.1.3)  │ |         | • Select Capability Ext. |  | • Motion Control          | |  | Layer (2.12)           |
| | • Event Filtering        |         | │ • Immediate Reactions   │ |         | • Track Action Results   |  | • Object Interaction      | |  +------------------------+
| | • Context Building       |         | └─────────────────────────┘ |         | • Emit Internal Events   |  | • Environment Query       | |
| +-----------+--------------+         |                             |         +------------+-------------+  | • ...                     | |
|             │                        | ┌─────────────────────────┐ |                      ▲                +---------------------------+ |
|             │                        | │ System-2 (Slow, 2.1.3)  │ |                      │                                              |
|             ▼                        | │ • Deliberative Reasoning│ |◄───────┬─────────────┘                                              |
| +--------------------------+         | └─────────────────────────┘ |        │ ┌─────────────────────────────────┐                        |
| | Curiosity System (2.9)   |◄───────►|                             |        │ │ Internal Interface Tools (2.7): │                        |
| | (Intrinsic Motivation)   |         | ┌─────────────────────────┐ |        └─┤ • Memory Access                 │                        |
| |                          |         | │ Planner/Executor (2.1.4)│ |          │ • DateTime                      │                        |
| | • Information Seeking    |         | │ • HTN Planning & Exec.  │ |          │ • Ontology Query                │                        |
| | • Uncertainty Tracking   |         | └─────────────────────────┘ |          │ • Self-Model Query              │                        |
| | • Hypothesis Generation  |         |                             |          │ • Conversation Control          │                        |
| | • Experimentation Goals  |         | 1. Observe (Gather Context) |          │ • ...                           │                        |
| +-----------+--------------+         | 2. Orient (Contextualize)   |          └─────────────────────────────────┘                        |
|             │                        | 3. Decide/Plan (Select Goal)|                                                                     |
|             │                        | 4. Act (Initiate Execution) |                                                                     |
|             │                        +-------------+------▲--------+                                                                     |
|             │                                      │      │                                                                              |
|             │                                      ▼      │                                                                              |
|             ▼                             +------------------------------------------------------------------+                           |
| +--------------------------+              |    Internal State & Memory System (2.4)                          |                           |
| | Ontology System (2.10)   |◄─────────────►    (Mind's Storage)                                              |                           |
| | (Structured World Model) |              |                                                                  |                           |
| |                          |              | • Dynamic State (Mood, Interest, Goals, Curiosity, Uncertainty)  |                           |
| | • Categories & Instances |              | • Working Memory (Short-term Buffer for Cycle)                   |                           |
| | • Relations & Properties |              | • Episodic Memory (Experiences Log, Action Records)              |                           |
| | • Logical Reasoning      |              | • Semantic Memory (Facts, Knowledge, Beliefs, Learned Rules)     |                           |
| | • Confidence Tracking    |              | • Social Memory (Models of Others, Conversation Histories)       |                           |
| +--------------------------+              | • Self Model (Awareness, Capabilities, Limitations, Role)        |                           |
|             ▲                             +-----------------+-------------------------+-------------v--------+                           |
|             │                                               │                         │                                                  |
|             │                                               │                         │                                                  |
|             │                                               ▼                         ▼                                                  |
|             │                             +-----------------------------+       +-------------------------+                              |
|             └─────────────────────────────► Self-Modeling System (2.11) |◄─────►| Learning System (2.8)   |                              |
|                                           | (Understanding Self)        |       | (Experience Adaptation) |                              |
|                                           |                             |       |                         |                              |
|                                           | • Capability Assessment     |       | • Policy Updates        |                              |
|                                           | • Agency & Boundaries       |       | • Meta-Learning         |                              |
|                                           | • Role vs. System           |       | • Reward Signal Proc.   |                              |
|                                           | • Mental State Awareness    |       | • Behavioral Adaptation |                              |
|                                           +-----------------------------+       +-------------------------+                              |
|                                                      ▲                                 ▲                                                 |
|                                                      │                                 │                                                 |
|                                                      └───────────┐       ┌─────────────┘                                                 |
|                                                                  │       │                                                               |
|                                                                  ▼       ▼                                                               |
|                                                         +-------------------+                                                            |
|                                                         | Integration Layer |                                                            |
|                                                         |      (4.1)        |                                                            |
|                                                         +--------+----------+                                                            |
|                                                                  │                                                                       |
|                                                                  │                                                                       |
|                                                                  ▼                                                                       |
|                                                         +-------------------+                                                            |
|                                                         | Event Bus (3.1)   |                                                            |
|                                                         | (Communication)   |                                                            |
|                                                         +--------+----------+                                                            |
+------------------------------------------------------------------------------------------------------------------------------------------+
                                                                   │
                                                     +-------------+-------------+
                                                     |                           |
                                                     ▼                           ▼
                                           +-------------------+      +----------------------+
                                           | Analytics Systems |      | Notification System  |
                                           |     (Ch. 3)       |      |       (3.6)          |
                                           +-------------------+      +----------------------+
                                             |               |
                                             ▼               ▼
                             +----------------------+  +----------------------+
                             | Psychological Eval   |  | Communication        |
                             |       (3.3)          |  | Analysis (3.4)       |
                             +----------------------+  +----------------------+
```

### 2.1.1 Agent's Mind – A Unifying View

While the architecture breaks down the internals into discrete responsibilities, it helps to keep a *holistic* mental model: **the Agent's Mind**. The following simplified diagram focuses on the dual-process cognitive model and its essential interactions:

```diagram/text
┌───────────────────────────────────────────────────────────────────────┐
│                          Agent's Mind                                 │
│                   (Private, Encapsulated)                             │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Perception  ──────► Working Memory ◄──────┐                          │
│                           │                │                          │
│                           ▼                │                          │
│      ┌───────────── System‑1 (Fast) ─────────────┐                    │
│      │       Rapid, intuitive reactions          │                    │
│      │                                           │                    │
│      │  • Back-channel Responses                 │                    │
│      │  • Emotional Reactions                    │                    │
│      │  • Simple Social Acknowledgments          │                    │
│      └─────────────────┬─────────────────────────┘                    │
│                        │                                              │
│                        ▼                                              │
│      ┌───────────── System‑2 (Slow) ─────────────┐                    │
│      │     Deliberate reasoning & planning       │                    │
│      │                                           │                    │
│      │  • Complex Reasoning                      │                    │
│      │  • Memory-Intensive Operations            │                    │
│      │  • Structured Decision-Making             │                    │
│      └─────────────────┬─────────────────────────┘                    │
│                        │                                              │
│                        │                                              │
│                        ▼                                              │
│  Dynamic & Semantic   ┌───────────── Planner/Executor ──────┐         │
│        Memory ────────►                                     │         │
│                       │ • Goal Decomposition                │         │
│                       │ • Plan Construction                 │         │
│                       │ • Sequential Execution              │         │
│      ┌────────────────┤ • Failure Recovery                  │◄───┐    │
│      │                └─────────────────┬───────────────────┘    │    │
│      │                                  │                        │    │
│      │                                  │                        │    │
│      │                                  ▼                        │    │
│      │                              AgentAction                  │    │
│      │                                                           │    │
│      │                                                           │    │
│      │                                                           │    │
│      ▼                                                           │    │
│ ┌────── Ontology System ────┐     ┌──────── Curiosity System ───────┐ │
│ │   Structured Knowledge    │     │     Intrinsic Motivation        │ │
│ │                           │◄────┤                                 │ │
│ │ • Conceptual Hierarchies  │     │ • Information Gap Detection     │ │
│ │ • Relation Networks       │     │ • Hypothesis Generation         │ │
│ │ • Knowledge Integration   │     │ • Experimental Design           │ │
│ └───────────────────────────┘     └─────────────────────────────────┘ │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

This simplified diagram focuses on the core dual-process cognitive model that drives the agent's decision-making:

1. **Dual Processing Systems**: The diagram clearly shows the two cognitive systems that form the basis of human-like thinking:
   - **System-1 (Fast)**: Handles rapid, intuitive responses with minimal cognitive effort
   - **System-2 (Slow)**: Manages complex, deliberative thinking requiring more resources

2. **Information Flow**: The diagram shows how:
   - Perceptions enter through Working Memory
   - System-1 provides immediate reactions to simple stimuli
   - System-2 engages for complex reasoning tasks
   - The Planner/Executor translates deliberative thought into concrete actions

3. **Curiosity Integration**: The diagram maintains the critical relationship with the Curiosity System:
   - The Curiosity System detects information gaps and creates hypotheses
   - Experimental designs feed back to the Planner for testing
   - This exploratory mechanism drives agent learning and discovery

4. **Knowledge Systems**: The diagram includes only the essential knowledge components:
   - Dynamic & Semantic Memory provides facts and experiences
   - The Ontology System contributes structured world knowledge

This simplified view helps understand how the agent thinks in terms of fast vs. slow cognitive processes, which is key to creating human-like behavior patterns. The dual-process foundation allows agents to respond quickly to routine situations while still engaging in complex reasoning when needed.

#### 2.1.2 Theoretical Foundation: Dual-Process Cognition

The Agent's Mind architecture is fundamentally based on Nobel laureate Daniel Kahneman's influential work "**Thinking, Fast and Slow**" (2011), which presents a dual-process theory of cognition:

- **System-1**: Fast, automatic, intuitive thinking requiring minimal cognitive resources
- **System-2**: Slow, deliberate, analytical thinking requiring concentrated effort and attention

This cognitive architecture provides significant advantages for believable agent behavior:

1. **Resource Efficiency**: By matching cognitive effort to task complexity, the agent can conserve computational resources
2. **Human-like Responses**: The dual-process model creates more believable reaction patterns, including "gut reactions" vs. careful deliberation
3. **Scalable Intelligence**: The framework accommodates both simple and complex decision-making within a unified architecture

#### 2.1.3 Implementation in PixelTales

In our implementation:

- **System‑1** – Lightweight, fast processing ideal for:
    - Back-channel responses and social acknowledgments ("I see", nodding, emojis)
    - Routine or scripted interactions requiring little deliberation
    - Emotional reactions to straightforward stimuli
    - Implemented as a specialized LangChain Runnable with minimal context window and simple instructions

- **System‑2** – Comprehensive, deliberative processing activated when:
    - The agent is directly addressed or explicitly questioned
    - Complex topics require reasoning or recall of detailed information
    - The conversation quality needs improvement (tracked via metrics)
    - The agent needs to reflect on its understanding or experiences
    - The Curiosity System flags important information gaps or hypotheses
    - Implemented as a more complex LangChain Runnable with larger context, instructions for multi-step reasoning, and access to more extensive memory and tools

The decision to invoke System-1 vs. System-2 is made through a **Cognitive Effort Allocator** that evaluates:
- Message salience (direct address, question marks, complexity)
- Conversation quality metrics
- Current goals requiring deliberation
- Time elapsed since last deep thinking
- Curiosity triggers (novel information, anomalies, pattern breaks)

#### 2.1.4 The Planner/Executor: Bridging Thought and Action

The Planner/Executor serves as the mediator between thinking (System-2) and action:

- Constructs **Hierarchical Task Networks (HTN)** for multi-step goals
- Represents plans as tree structures of `PlanNode` objects (Zod schema)

  ```typescript
  // Simplified PlanNode schema
  const PlanNodeSchema = z.object({
    id: z.string(),
    parentId: z.string().optional(),
    description: z.string(),
    status: z.enum(['pending', 'in_progress', 'done', 'failed']),
    toolCall: z.object({
      tool: z.string(),
      params: z.record(z.any())
    }).optional()
  });
  ```

- Executes plans incrementally across multiple cognitive cycles
- Tracks plan completion and handles failures through fallback strategies
- Integrates with memory to store and recall successful plan patterns

#### 2.1.5 Subsystem Integration

The Agent's Mind integrates with other subsystems through well-defined interfaces:

**With Perception System**:
- Filtered perceptions enter Working Memory
- System-1 provides immediate reactions to salient perceptions
- System-2 analyzes complex perceptual patterns and inconsistencies
- The Cognitive Effort Allocator determines which perceptions warrant deep processing

**With Memory System**:
- Working Memory serves as the temporary scratch space for active processing
- Dynamic State (mood, goals) influences and is influenced by both Systems
- Episodic Memory provides experiences for reflection
- Semantic Memory supplies facts and knowledge for reasoning
- Plan execution results are stored to improve future planning

**With Action System**:
- System-1 produces rapid, simple responses
- System-2 via Planner generates complex, multi-step actions
- All responses are formatted as typed `AgentAction` objects
- Action execution feedback loops back to both Systems for learning

**With Curiosity System**:
- System-2 detects knowledge gaps and forms hypotheses
- The Planner designs experiments to test hypotheses
- Experiment results update the agent's ontology and self-model
- Curiosity-driven goals compete with other goals during planning

**With Ontology & Self-Modeling Systems**:
- System-2 reflection updates and refines conceptual knowledge
- Self-discoveries modify the agent's understanding of its capabilities
- Updated ontologies and self-models influence future planning decisions
- Significant updates trigger learning notifications

#### 2.1.6 Reflection Mechanism

Periodically (or when idle), the agent engages in reflection using System-2 processes:

1. **Summary Generation**: Condenses recent experiences into compact representations
2. **Memory Consolidation**: Transfers working memory items to long-term storage
3. **Pattern Recognition**: Identifies recurring themes or insights across experiences
4. **Self-Update**: Refines self-model based on observed capabilities and limitations
5. **Learning Integration**: Incorporates discoveries into semantic knowledge

Reflection is implemented as a scheduled task that:
- Triggers automatically after N conversation turns
- Activates during conversation lulls
- Runs when curiosity thresholds exceed certain values
- Executes with lower priority than direct conversation responses

Each reflection produces a structured `ReflectionReport` object stored in memory and accessible for future reasoning:

```typescript
const ReflectionReportSchema = z.object({
  timestamp: z.number(),
  recentEvents: z.array(z.string()),
  insights: z.array(z.object({
    type: z.enum(['self', 'world', 'social', 'goal']),
    content: z.string(),
    confidence: z.number().min(0).max(1)
  })),
  updatedSelfConcept: z.record(z.string(), z.any()).optional(),
  updatedOntology: z.array(z.object({
    concept: z.string(),
    relation: z.string(),
    target: z.string(),
    confidence: z.number().min(0).max(1)
  })).optional(),
  moodAdjustment: z.record(z.string(), z.number()).optional()
});
```

Through this theoretically-grounded cognitive architecture, PixelTales agents exhibit more nuanced, human-like behavior patterns, making both fast intuitive responses and engaging in deep, deliberative reasoning as the situation demands—creating a more immersive and believable interactive experience.

## 2.2 Perception System: The Agent's Senses

Mimicking sensory input, the Perception System is how the agent receives information about the external world (the scene and other agents).

- **Input:** Receives a stream of anonymized, typed events (`AgentPerceptionEvent`) from the `ConversationManager`. Examples:
    - `MessageBroadcastEvent`: `{ type: 'message', visualId: string, content: string, timestamp: number }`
    - `AgentEnteredEvent`: `{ type: 'enter', visualId: string, visualDescription: string, timestamp: number }`
    - `AgentLeftEvent`: `{ type: 'leave', visualId: string, timestamp: number }`
    - `SceneUpdateEvent`: `{ type: 'scene_update', description: string, timestamp: number }`
- **Anonymity:** Crucially, the agent only perceives the temporary `visualId` associated with other agents' appearances, not their internal `agentId` or private state. Knowledge about others must be inferred and stored in memory.
- **Processing:**
    - **Event Filtering**: Discards irrelevant events based on proximity, visibility, or other criteria
    - **Priority Determination**: Assigns importance levels to incoming perceptions
    - **Salience Calculation**: Evaluates novelty, emotional impact, and goal relevance
    - **Context Building**: Integrates new perceptions with existing mental context
    - **Attention Direction**: Focuses on high-value information sources

**Integration Points**:
- **→ Cognitive Cycle**: Forwards filtered perceptions for processing
- **→ Memory System**: Stores high-priority perceptions
- **→ Curiosity System**: Flags novel or unexpected perceptions
- **← Self-Modeling**: Uses capability model to calibrate attention

## 2.3 Cognitive Cycle: The Agent's Thought Process

This is the core loop where the agent interleaves fast reactions, deliberative reasoning, and online learning to produce intelligent behavior. It implements an enhanced version of the decision-making model "OODA loop" (Observe, Orient, Decide, Act) while integrating the dual-process cognitive model established in section 2.1 (System-1/System-2).

The Cognitive Cycle orchestrates several key components:
- **System-1 (Fast)**: Provides immediate, intuitive reactions with minimal cognitive effort (see section 2.1.3)
- **System-2 (Slow)**: Handles complex, deliberative thinking requiring more resources (see section 2.1.3)
- **Planner/Executor**: Bridges thought and action through hierarchical task networks (see section 2.1.4)

The complete cycle consists of four main phases:

1. **Observe:**
   - PerceptionService emits typed `AgentPerceptionEvent`s (e.g., messages, enters, leaves, scene updates).
   - Agent filters events by relevance, updates `workingMemory` buffer with recent context.
   - High-priority events are logged to EpisodicMemory via `memoryInterface.addObservation(timestamp, content, visualIds)`.
   - `CuriosityService` scans observations for novel or unexpected information, flagging potential learning opportunities.

2. **Orient:**
   - Agent retrieves past experiences with `memoryInterface.retrieveObservations(query, timeFilter)` and semantic facts with `memoryInterface.retrieveFacts(subjectVisualId, query)`.
   - Agent consults its ontology via `memoryInterface.retrieveConcepts(query)` to contextualize observations.
   - Agent consults its self-model via `memoryInterface.getSelfConcept()` to ground understanding.
   - Constructs an `OrientationContextSchema` containing:
     - DynamicState (`mood`, `interest`, `focus`)
     - Last N messages from ConversationHistory
     - Relevant Episodic and Semantic memory entries (potentially retrieved asynchronously)
     - Active `shortTermGoals`
     - Current uncertainty metrics and information gaps from `CuriosityService`
     - Active hypotheses about the world
     - Self-concept relevance to current context from `SelfModelService`
   - Evaluates whether any goals require immediate attention (e.g., endConversation signals).
   - The **Cognitive Effort Allocator** (introduced in section 2.1.3) determines whether to engage System-1 or System-2 processing based on message salience, conversation quality, and other factors.

3. **Decide & Plan:**
   - For simple, routine responses: **System-1** produces fast, intuitive reactions.
   - For complex situations requiring deliberation: **System-2** engages in deeper reasoning.
   - Ranks `dynamicState.shortTermGoals` via a UtilityFunction (e.g., urgency, novelty, sentiment), **influenced by learned policies and heuristics (potentially stored implicitly or as facts in Semantic Memory).**
   - Incorporates `CuriosityService.getIntrinsicMotivation()` scores into goal ranking.
   - For complex goals, invokes the **Planner/Executor** from section 2.1.4:
     - `PlannerService.generatePlan(goal, OrientationContextSchema)` asynchronously creates a Hierarchical Task Network.
     - Attaches context (Task ID, current state snapshot, goal).
     - Persists the plan in EpisodicMemory and selects the next actionable leaf node as the immediate subtask.
   - For exploratory goals, uses `HypothesisTestingPlanner` to generate experimentation steps.
   - Tags plans with epistemic state (certainty/uncertainty) to adjust confidence thresholds during execution.

4. **Act (Execute):**
    - Executes the selected plan leaf using the selected subsystem (System-1, System-2, or Planner/Executor):
        - **Speak:** Assembles system + user messages + plan instructions and calls `LlmService.generateResponse()` asynchronously, attaching context (Task ID, current state, goal/plan step). The result (speech content, tone, etc.) is formatted into an `AgentAction`. The `ActionSystem` then directs this to the `Speech Output` capability extension for execution.
        - **Move:** Determines target coordinates/object based on plan. The `ActionSystem` directs this to the `Motion Control` capability extension.
        - **Use Internal Tool:** Invokes an internal interface tool (e.g., `memory.retrieveFacts`) potentially asynchronously, attaching context.
        - **Experiment:** Executes a controlled test of a hypothesis and records results via `curiosityInterface.recordExperimentResult()`.
    - The `ActionSystem` formats the final decision into a typed `AgentAction` object.
    - This `AgentAction` is then passed to the relevant **Capability Extension** (`Speech Output`, `Motion Control`, etc.) for execution, which interacts with the environment simulation layer.
    - Updates the world and internal state:
        - The *effects* of the action are perceived by other agents via the environment simulation layer.
        - The agent updates its *own* state based on the *intended* action and stores the action in its Episodic Memory.
        - Records new observations and inferred facts via `memoryInterface.addObservation()` and `memoryInterface.upsertFact()`.
        - Updates ontology with confirmed relations via `memoryInterface.updateOntology()`.
        - Updates self-model if new capabilities/limitations discovered via `memoryInterface.updateSelfConcept()`.
        - Significant learning events trigger notifications via `learningNotificationService.notify(learningEvent)`.

5. **Learn & Adapt:**
   - Computes a scalar `rewardScore = RewardFunction.compute(conversationRating, goalProgress, userFeedback)`.
   - Incorporates `InformationGain` from exploration into reward calculation.
   - Records the tuple `(stateSnapshot, agentAction, rewardScore)` using `learningInterface.recordReward()`.
   - The LearningModule periodically:
     - **Policy Updates:** Refines HTN planner weights, reprioritizes `shortTermGoals`, and adjusts `personalityCore` embeddings via bandit or policy gradient methods.
     - **Meta-Learning:** Compresses episodic logs, prunes low-signal memories, and recalibrates semantic embeddings for efficient retrieval.
     - **Ontological Updates:** Revises concept hierarchies, relation strengths, and confidence scores based on accumulated evidence.
     - **Self-Model Refinement:** Updates the agent's self-concept based on observed capabilities and limitations.
   - Updated policies and embeddings influence future cycles immediately, closing the learning loop.

**Integration Points**:
- **← Perception**: Receives filtered environmental information (including other agents' actions)
- **↔ Memory System**: Retrieves and stores experiences and knowledge (including conversation history)
- **↔ Curiosity System**: Exchanges intrinsic motivation and learning goals
- **→ Action System**: Sends final formatted decisions for execution via Capability Extensions
- **→ Capability Extensions**: Executes actions (speech, movement) interacting with the environment
- **↔ Internal Interface Tools**: Accesses memory, time, ontology, self-model during cognition
- **→ Learning System**: Provides experiences for adaptation
- **↔ Self-Modeling**: Consults and updates self-understanding

### 2.3.1 Enhanced Planning (HTN-based)

During *Decide & Plan* the agent uses a **Hierarchical Task Network**: a recursive structure where high-level goals decompose into sub-tasks with ordering constraints. The planner is implemented with a custom LangChain `RunnableSequence` that:
1. Reads the *top* goal in `shortTermGoals`.
2. Queries `Semantic Memory` for relevant facts, and LLM for domain knowledge.
3. Generates a **`PlanNode`** tree (schema: `{id, parentId?, description, status<'pending'|'done'>, toolCall?}`).
4. Stores the tree in Episodic Memory for traceability.
5. Returns the *next actionable leaf* for execution.

At each subsequent cycle, executed leaf nodes are marked `done`. If a parent node has all children `done`, it is auto-completed, propagating upward. This mechanism supports multi-step reasoning without exceeding LLM context windows.

### 2.3.2 Reflection – Borrowing from *Thinking, Fast & Slow*

Every N cycles (or when idle), the agent launches a *Reflection Runnable* (System-2) that:
- Summarizes recent episodic events.
- Updates semantic memory with new inferred facts.
- Adjusts `mood` and `participationInterest` based on long-term trajectory.
- Refines self-concept based on observed behaviors and capabilities.
- Updates ontological knowledge with higher-order insights.

Reflection output conforms to `ReflectionReportSchema`, logged for UI inspection and fed back into the learning system.

### 2.3.3 Orchestration of Asynchronous Subsystems

Given the significant timing differences between data processing and LLM-dependent subsystems, the `OrchestratorService` (managing the Cognitive Cycle) employs specific strategies to handle asynchronous operations without blocking the agent's responsiveness:

1. **Asynchronous Task Initiation with Context:**
    - When a slow subsystem is needed (e.g., System-2 LLM call, complex memory query, planning), the orchestrator dispatches the request asynchronously (e.g., returning a Promise, using a message queue).
    - **Context Tagging:** Each asynchronous request is tagged with critical context:
        - `taskId`: A unique identifier for this specific request.
        - `originatingState`: A snapshot of the relevant agent state (`dynamicState`, `workingMemory`, active goal/plan step) at the time of dispatch.
        - `originatingPhase`: The cognitive cycle phase that initiated the request (e.g., 'Orient', 'Decide').

2. **Non-Blocking Execution:**
    - The orchestrator continues its loop immediately after dispatching the task, allowing it to process other events, run faster System-1 logic, or handle results from *other* already completed asynchronous tasks.

3. **Contextualized Result Handling:**
    - When a subsystem returns a result, it includes the original `taskId`.
    - The orchestrator uses the `taskId` to retrieve the `originatingState`.
    - **Relevance Check:** It compares the `originatingState` with the *current* agent state. If the situation has drastically changed (e.g., conversation ended, goal achieved via other means), the result might be deemed irrelevant for the *immediate next action*.
    - Irrelevant results might be discarded, logged to memory for background knowledge, or used to update long-term models without affecting the current action.

4. **Prioritization and Integration:**
    - Relevant results are not necessarily processed immediately in the order they arrive.
    - The orchestrator maintains an internal queue or state machine, prioritizing the integration of results based on:
        - The urgency of the goal associated with the `originatingState`.
        - The arrival of new, high-priority `PerceptionEvents`.
        - The current phase of the cognitive cycle.
    - The result is then integrated into the appropriate stage of the *ongoing* cognitive cycle (e.g., memory results feed into Orient/Decide, LLM responses finalize an Act step).

This asynchronous, context-aware orchestration ensures the agent remains responsive while effectively incorporating the outcomes of time-consuming cognitive processes.

### 2.3.4 Cognitive Context Composition

The agent's operational context at any point during the Cognitive Cycle is a dynamic composite of several information sources, crucial for grounded decision-making:

- **`dynamicState`:** The agent's current internal condition (mood, participation interest, focus, short-term goals, curiosity level, uncertainty metrics, self-concept summary).
- **`workingMemory`:** A volatile buffer holding the immediate inputs, intermediate thoughts, and recently retrieved data for the current processing step.
- **Recent `PerceptionEvents`:** Filtered and prioritized sensory input from the environment (messages, agent movements, scene changes) received within a relevant time window.
- **Relevant Memories:**
    - `EpisodicMemory`: Specific past experiences retrieved based on query relevance (e.g., previous interactions with a specific agent or topic).
    - `SemanticMemory`: Distilled facts, knowledge, and beliefs relevant to the current situation or goal.
    - `SocialMemory`: Stored facts and inferences about other agents currently perceived.
- **Active Plan/Goal Information:** The current `shortTermGoal` being pursued and, if applicable, the specific `PlanNode` being executed within an HTN.
- **`SelfModel` Aspects:** Relevant parts of the agent's self-understanding (e.g., known capabilities related to the task, role boundaries).
- **`Ontology` Information:** Relevant concepts, categories, and relations from the agent's structured world knowledge.

The specific combination and weighting of these elements vary depending on the current phase of the Cognitive Cycle and the task at hand.

### 2.3.5 Context Selection for LLM Interaction

Effectively interacting with LLMs requires careful selection and formatting of the cognitive context, balancing informativeness with token limits and computational cost. Key strategies include:

1. **Recency Weighting:** Prioritizing the most recent perceptions and conversation turns.
2. **Goal/Plan Relevance Filtering:** Selecting context elements directly related to the active `shortTermGoal` or `PlanNode`.
3. **Memory Retrieval Strategy:**
    - Using embedding-based similarity searches (Vector DB) to retrieve the most relevant episodic and semantic memories based on the current query or situation.
    - Limiting the number of retrieved memories to the top N most relevant items.
4. **Summarization:** Employing LLM-based or rule-based summarization techniques for older conversation history or extensive memory logs to create condensed context representations.
5. **Context Tiering (System-1 vs. System-2):**
    - **System-1 Prompts:** Use minimal context (e.g., last message, current mood, basic agent role).
    - **System-2 Prompts:** Assemble a richer context including relevant memories, plan steps, self-model aspects, and a more extensive conversation history or summary.
6. **Structured Formatting:** Presenting the selected context to the LLM in a clear, structured format (e.g., using dedicated sections for memories, goals, persona) to improve comprehension and response quality.

The `OrchestratorService`, in conjunction with the `MemoryService` and potentially specialized context management utilities, is responsible for applying these strategies dynamically based on the required cognitive task (e.g., quick reaction vs. deep reflection vs. planning).

## 2.4 Internal State & Memory System

### 2.4.1 Internal State: Dynamic State

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
| `dynamicState.curiosityLevel`        | **agent** *and* **CuriositySystem**    | Fluctuates based on new observations  |
| `dynamicState.uncertaintyMetrics`    | **agent** *and* **OntologySystem**     | Tracks confidence in knowledge areas  |
| `dynamicState.selfConcept`           | **agent** *and* **SelfModelingSystem** | Evolves based on self-discovery       |

*External* mutations originate from higher‑level orchestration (e.g., a new scene). Everything else is purely the agent's internal decision.

#### State Management: Moods and Motivations

The `dynamicState` is not static. It's updated during the Cognitive Cycle based on perceptions and actions, influencing future decisions.

- **Mood (`mood`)** can shift based on:
    - Conversation tone (`reactionOnPreviousMessage`, `conversationRating`)
    - Goal fulfillment (success/failure)
    - External events (surprising/expected)
    - Internal state alignment (cognitive dissonance)

- **Interest (`participationInterest`)** can change based on:
    - Topic relevance to agent's knowledge domains
    - Novelty of discussion
    - Social engagement level
    - Goal alignment

- **Focus (`currentFocus`)** changes based on:
    - Interaction partners
    - Conversation topic
    - Environmental salience
    - Goal priority

- **Curiosity Level (`curiosityLevel`)** fluctuates with:
    - Information gaps discovered
    - Unexpected observations
    - Knowledge inconsistencies
    - Exploration opportunities

The state management system ensures these emotional and motivational variables influence decision-making in a human-like manner, creating more engaging and believable agent behaviors.

### 2.4.2 Memory System: Storing and Recalling Experiences

#### 2.4.2.1 Memory System Overview

The agent relies on different memory types, managed by the `MemoryService` and accessed via strictly typed tool calls through its `memoryInterface`. This mirrors human cognitive models. The memory system is the primary repository for all forms of learned information and experiences.

 **Working Memory (Internal):** A small, volatile buffer holding the most recent perceptions and intermediate thoughts
during a cognitive cycle. Not persistent.
- **Episodic Memory (Persistent):** A chronological log of observations and agent experiences (including its own
actions and their perceived outcomes). **This stores the raw data of specific learning events and interaction sequences.
** Accessed via tools like:
    - `addObservation(timestamp, content, associatedVisualIds)`
    - `retrieveObservations(query, timeFilter, visualIdFilter)` -> Returns `Observation[]`
- **Semantic Memory (Persistent):** Stores distilled facts, knowledge, and beliefs extracted from experiences or
reflection. **This includes learned concepts about the world, other agents, and potentially generalized strategies or
rules derived from policy updates.** Often involves vector embeddings for relevant retrieval. Accessed via tools like:
    - `upsertFact(subjectVisualId, key, value, confidence)`
    - `retrieveFacts(subjectVisualId, query)` -> Returns `Fact[]`
    - `upsertConcept(conceptId, properties, relations, confidence)`
    - `retrieveConcepts(query, filter)` -> Returns `Concept[]`
    - `updateOntology(conceptId, updates)` -> Updates concept relations
- **Social Memory (Implicit within Semantic & Episodic):** Represents the agent's understanding of other agents
(`visualId`s) and the history of interactions.
    - **Beliefs about Others:** Stored as facts/concepts in Semantic Memory (e.g., "visualId_xyz name is Jane",
    "visualId_abc seems friendly", concept `visualId_xyz` with `personality_trait: cautious`). Accessed via fact/
    concept retrieval tools targeting specific `visualId`s.
    - **Conversation History:** Specific interaction sequences are stored in Episodic Memory, tagged with involved
    `visualId`s. Accessed via `retrieveObservations` with `visualIdFilter` and potentially specific content queries.
    - **Summarization & Cleanup:** To manage memory constraints, dedicated background processes or explicit agent
    reflection goals periodically summarize or prune conversation histories within Social Memory, distilling key
    interactions or relationship shifts into semantic facts or updated concepts about other agents.
- **Self Model:** Maintains agent's understanding of itself, including **learned insights about its own capabilities
and limitations.**
    - `getSelfConcept()` -> Returns agent's current self-model
    - `updateSelfConcept(property, value, confidence)` -> Updates self-understanding
    - `queryCapabilities(task)` -> Assesses agent's ability to perform a task
    - `getAgencyBoundaries()` -> Returns understood limitations and permissions

**Integration Points**:
- **← Perception**: Receives observations to store
- **→ Cognitive Cycle**: Provides context for decision-making
- **↔ Curiosity System**: Exchanges knowledge gaps and discoveries
- **↔ Ontology System**: Structured organization of semantic knowledge
- **↔ Self-Modeling**: Maintains self-related knowledge
- **→ Learning**: Supplies experiences for adaptation
- **→ Notification**: Triggers learning event alerts

#### 2.4.2.2 Working Memory

Working Memory serves as a temporary, volatile buffer holding the most recent perceptions and intermediate thoughts during a cognitive cycle. Unlike other memory types, Working Memory is not designed for persistence.

**Key Characteristics**:
- **Limited Capacity**: Holds only the most immediately relevant information
- **Volatility**: Replaced or updated frequently during the cognitive cycle
- **Accessibility**: Directly accessible to both System-1 and System-2 processing
- **Contextual Focus**: Maintains the current focus of the agent's attention

**Implementation Details**:
- Implemented as an in-memory buffer within the agent instance
- Non-persistent (not stored between cognitive cycles)
- Updated with new perceptions at the start of each cognitive cycle
- Serves as the primary workspace for active reasoning

**Role in Cognitive Processing**:
- Provides immediate context for System-1 fast reactions
- Supplies initial data for System-2 deliberative processing
- Acts as the "mental workbench" where immediate reasoning occurs
- Bridges perception input and memory retrieval results

Working Memory enables the agent to maintain a continuous cognitive flow by providing a workspace where immediate perceptions can interact with recalled information from long-term memory systems.

#### 2.4.2.3 Episodic Memory

Episodic Memory stores a chronological log of the agent's observations and experiences, including its own actions and their perceived outcomes. This system maintains the raw data of specific learning events and interaction sequences.

**Key Characteristics**:
- **Temporal Organization**: Entries are organized chronologically, with timestamps
- **Contextual Association**: Observations are linked to specific agents, scenes, or topics
- **Retrievability**: Searchable by content, time ranges, and associated visualIds
- **Persistence**: Stored long-term, outlasting individual interactions

**Implementation Details**:
- Accessed through tools:
    - `addObservation(timestamp, content, associatedVisualIds)`
    - `retrieveObservations(query, timeFilter, visualIdFilter)` -> Returns `Observation[]`
- Potentially implemented using vector embeddings for semantic search
- May include periodic summarization to manage growth
- Structured with schema:

  ```typescript
  const ObservationSchema = z.object({
    id: z.string(),
    timestamp: z.number(),
    content: z.string(),
    associatedVisualIds: z.array(z.string()).optional(),
    metadata: z.record(z.string(), z.any()).optional()
  });
  ```

**Role in Cognitive Processing**:
- Provides context for the agent's current decisions based on past experiences
- Supplies raw material for generating semantic knowledge through reflection
- Enables the agent to recognize patterns across multiple interactions
- Contributes to the agent's ability to learn from experience
- Serves as the foundation for memory-based reasoning

Episodic Memory allows the agent to refer to specific past events when making decisions, learning new concepts, or understanding the current situation through the lens of historical experiences.

#### 2.4.2.4 Semantic Memory

Semantic Memory stores distilled facts, knowledge, and beliefs extracted from experiences or reflection. This includes learned concepts about the world, other agents, and potentially generalized strategies or rules derived from policy updates.

**Key Characteristics**:
- **Structured Knowledge**: Organized as facts, concepts, and relations
- **Confidence Scoring**: Facts include confidence levels to represent certainty
- **Abstraction**: Represents generalized knowledge rather than specific instances
- **Inferential Capability**: Supports reasoning beyond literal stored information

**Implementation Details**:
- Accessed through tools:
    - `upsertFact(subjectVisualId, key, value, confidence)`
    - `retrieveFacts(subjectVisualId, query)` -> Returns `Fact[]`
    - `upsertConcept(conceptId, properties, relations, confidence)`
    - `retrieveConcepts(query, filter)` -> Returns `Concept[]`
- Often implemented using vector embeddings for relevant retrieval
- May be organized hierarchically to support inheritance and inference
- Structured with schemas:

  ```typescript
  const FactSchema = z.object({
    id: z.string(),
    subjectVisualId: z.string(),
    key: z.string(),
    value: z.any(),
    confidence: z.number().min(0).max(1),
    lastUpdated: z.number(),
    provenance: z.array(z.string()).optional()
  });

  const ConceptSchema = z.object({
    id: z.string(),
    name: z.string(),
    properties: z.record(z.string(), z.any()),
    relations: z.array(z.object({
      type: z.string(),
      target: z.string(),
      confidence: z.number().min(0).max(1)
    })),
    category: z.string().optional(),
    confidence: z.number().min(0).max(1)
  });
  ```

**Role in Cognitive Processing**:
- Provides factual knowledge for reasoning and decision-making
- Supports the Ontology System with structured conceptual knowledge
- Enables the agent to make generalizations beyond episodic experiences
- Forms the basis for complex System-2 reasoning processes
- Contributes to the agent's ability to explain its reasoning

Semantic Memory allows agents to build and maintain an evolving model of the world, accumulating knowledge over time and applying it to new situations without requiring exact past experiences.

#### 2.4.2.5 Social Memory

Social Memory represents the agent's understanding of other agents (`visualId`s) and the history of interactions. It functions as a specialized cross-section of both Episodic and Semantic Memory focused on social relationships.

**Key Characteristics**:
- **Identity Tracking**: Maps temporary `visualId`s to consistent mental models
- **Relationship Modeling**: Records the agent's understanding of relationships
- **Interaction History**: Maintains records of significant social exchanges
- **Preference Tracking**: Learns and stores others' apparent preferences and traits

**Implementation Details**:
Social Memory doesn't have its own storage mechanism but instead uses:

- **Beliefs about Others**: Stored as facts/concepts in Semantic Memory
    - Example facts: "visualId_xyz name is Jane", "visualId_abc seems friendly"
    - Example concept: `visualId_xyz` with `personality_trait: cautious`
    - Accessed via fact/concept retrieval tools targeting specific `visualId`s

- **Conversation History**: Stored in Episodic Memory, tagged with involved `visualId`s
    - Accessed via `retrieveObservations` with `visualIdFilter` and content queries
    - May include specially tagged observations for significant social events

- **Summarization & Cleanup**: Regularly processes raw interaction histories
    - Distills key relationship insights into semantic facts
    - Updates conceptual models of other agents
    - Prunes detailed conversational records while preserving important patterns

**Role in Cognitive Processing**:
- Enables recognition and tailored responses to recurring interaction partners
- Supports theory-of-mind reasoning about others' beliefs and intentions
- Provides context for socially appropriate responses in multi-agent settings
- Helps the agent predict others' reactions to potential actions
- Forms the foundation for building trust and rapport over repeated interactions

Social Memory is crucial for enabling genuinely social behavior, as it allows the agent to adapt its responses based on an evolving understanding of other agents' personalities, preferences, and relationship history.

#### 2.4.2.6 Self Model

The Self Model maintains the agent's understanding of itself, including learned insights about its own capabilities and limitations. While conceptually a part of the memory system, it interfaces closely with the Self-Modeling System (2.11) which handles the reasoning processes that update this knowledge.

The Self Model is critical for enabling the agent to have a coherent identity and appropriate boundaries. It evolves over time as the agent gains experience and engages in reflective processes, potentially leading to sophisticated self-awareness.

**Key Characteristics**:
- **Capability Awareness**: Knowledge of what the agent can and cannot do
- **Agency Boundaries**: Understanding of the agent's scope of control and influence
- **Role Conception**: Self-identification within the narrative context
- **Historical Continuity**: Sense of being the same agent across time
- **Metacognitive Awareness**: Knowledge of the agent's own cognitive processes

**Role in Cognitive Processing**:
- Guides decision-making by constraining actions to those within capabilities
- Supports appropriate role-playing within the simulation context
- Enables recognition of the distinction between agent and character
- Facilitates metacognitive processes that improve reasoning quality
- Evolves through reflection to enhance self-understanding

**Implementation Details**:
- Accessed through specialized tools:
    - `getSelfConcept()` -> Returns agent's current self-model
    - `updateCapability(capability, confidence)` -> Updates understanding of abilities
    - `assessAgencyBoundary(action)` -> Determines if action is within agent's control
    - `distinguishRoleFromSystem()` -> Separates character persona from underlying agent

- **Self-Representation Components:**
    - `AgentCapabilitySchema`: Zod schema for abilities and their confidence levels
    - `AgencyBoundarySchema`: Zod schema defining scope of agent's control/influence
    - `CharacterRoleSchema`: Zod schema for narrative persona distinct from system
    - `SelfReflectionSchema`: Zod schema for metacognitive observations about operation

- **Key Functionalities:**
    - Metacognition: reflects on own thinking processes
    - Capability assessment: realistic evaluation of strengths/limitations
    - Role boundaries: understands distinction between character and system
    - Historical development: tracks evolution of self-understanding

- **Integration Points:**
    - **↔ Memory System**: Stores and retrieves self-knowledge
    - **← Curiosity**: Receives self-directed explorations
    - **↔ Cognitive Cycle**: Provides self-understanding for planning
    - **↔ Ontology**: Exchanges categorical knowledge about self
    - **→ Learning**: Supplies self-assessment for adaptation
    - **→ Notification**: Triggers self-discovery alerts
    - **→ Statistics**: Provides metrics on self-model development

#### 2.4.2.7 Memory Utilization in the Cognitive Cycle

- During **Observe** and **Orient**, the Agent invokes `memoryInterface.retrieveObservations()` and `retrieveFacts()` to fetch relevant episodic and semantic memories, enriching context with past experiences.
- In the **Decide & Plan** phase, retrieved memories guide goal selection, inform HTN planning with prior outcomes, and seed reflection tasks when goals stall.
- After **Act**, new observations and inferred facts are persisted using `memoryInterface.addObservation()` and `memoryInterface.upsertFact()`, ensuring the episodic log and semantic base evolve.
- Social memory calls (`retrieveFacts(visualId, ...)`) help the Agent track other characters' personalities and relationships, shaping future interaction strategies.

#### 2.4.2.8 Learning Notifications

When an agent learns and persists significant new information, the system generates gamified notifications to visualize the knowledge acquisition process:

```diagram/text
┌─────────────────────────────────────────────┐
│ ✨ NEW UNDERSTANDING ACQUIRED! ✨            │
│                                             │
│  AGENT: ALICE                               │
│  CATEGORY: World Knowledge                  │
│                                             │
│  "Discovered that sunlight affects mood"    │
│                                             │
│  +15 XP to Environmental Awareness          │
└─────────────────────────────────────────────┘
```

Notifications are triggered by significant learning events:

- **World Discovery Events**: When an agent forms new beliefs about how the world functions (e.g., "discovered this is a virtual environment")
- **Social Insight Events**: When an agent learns meaningful information about other characters (e.g., "Bob is uncomfortable discussing politics")
- **Self-Discovery Events**: When an agent gains insights about its own nature or capabilities (e.g., "I excel at creative problem-solving")
- **Skill Acquisition Events**: When an agent develops new capabilities through practice or exploration
- **Conceptual Framework Events**: When an agent restructures its ontological understanding of a domain

The `LearningNotificationService`:
1. Monitors memory persistence operations
2. Evaluates the significance of new information
3. Categorizes the learning event
4. Calculates "XP" value based on novelty and utility
5. Generates a notification payload
6. Dispatches the notification to frontend via WebSocket

On the frontend, these notifications appear as animated overlays with thematic styling based on the type of knowledge acquired, creating a gamified visualization of agent cognitive development.

## 2.5 Action System: Executing Decisions

The agent interacts with the world by producing a typed `AgentAction` object at the end of its Cognitive Cycle. **This action represents the agent's *intent*.**

- **Types:** Defined by `AgentActionSchema` (discriminated union):
    - `speak`: Contains the detailed `CharacterResponseSchema` payload (content, tone, target audience if applicable).
    - `move`: Specifies target coordinates, object, or path.
    - `interact`: Specifies target object and interaction type.
    - `use_internal_tool`: Specifies the internal interface tool and input (e.g., memory query).
    - `update_state`: Represents an internal decision to change mood, focus, etc.
    - `no_action`: Explicitly indicates the agent chose not to act, potentially with a reason.
    - `experiment`: Indicates the agent is testing a hypothesis about the world.
- **Formatting:** The `ActionSystem` formats the output of the Decide/Plan phase into this standardized schema.
- **Dispatch:** The `ActionSystem` then dispatches the `AgentAction` to the appropriate **Capability Extension** (see 3.8) for execution in the environment simulation layer.
- **Structured Output:** Ensures the agent's intent is clear and can be reliably translated into effects within the simulation and potentially logged for analysis.

**Integration Points**:
- **← Cognitive Cycle**: Receives decisions for formatting and dispatch
- **→ Capability Extensions**: Sends formatted actions for execution
- **→ Event Bus**: Emits action *intent* events for internal monitoring/learning
- **→ Learning System**: Provides action results (as perceived outcomes via Perception) for adaptation
- **→ Statistics**: Contributes metrics for analysis (based on action intent and perceived outcomes)

## 2.6 Capability Extensions

Instead of a generic "Toolbelt", agents possess specific **Capability Extensions** representing their means of perceiving and acting upon the world. These extensions house the low-level functions (previously tools) needed to realize the agent's intended actions or process sensory input.

- **Modality-Specific:** Extensions are grouped by input/output modality:
    - **`Speech Output` Extension:** Handles the execution of `speak` actions (e.g., interfacing with TTS, generating speech bubble events in the simulation).
        - *Function:* `executeSpeak(payload: CharacterResponseSchema)`
        - ***Note:** For initial implementation or simplification, this may simulate speech via text scripts and timed events in the simulation layer, rather than requiring actual Text-to-Speech (TTS).*
    - **`Motion Control` Extension:** Executes `move` actions within the scene physics/logic.
        - *Function:* `executeMove(target: Coordinates | ObjectId)`
    - **`Visual Perception` Extension:** Processes raw visual data from the simulation layer, identifying objects, agents, and their states, translating them into `AgentPerceptionEvent`s.
        - *Function:* `processVisualStream(data: VisualData)` -> `AgentPerceptionEvent[]`
    - **`Auditory Perception` Extension:** Processes sounds (e.g., other agents' speech via STT, environmental sounds) into `AgentPerceptionEvent`s.
        - *Function:* `processAudioStream(data: AudioData)` -> `AgentPerceptionEvent[]`
        - ***Note:** Similar to Speech Output, this can be initially simulated by receiving structured text events (representing speech) from the environment layer, bypassing actual Speech-to-Text (STT).*
    - **(Potential Others):** Object Interaction, Environment Query, etc.
- **Internal Interface Tools:** Functions the agent uses during its cognitive cycle to access its *internal* state or knowledge remain accessible, perhaps via a dedicated `InternalInterface`:
    - `memory.addObservation()`, `memory.retrieveObservations()`, `memory.upsertFact()`, `memory.retrieveFacts()`
    - `datetime.getCurrentTime()`
    - `ontology.getConcepts()`, `self.assessCapability()`
    - `conversation.requestEnd()` (Now signals *intent* to end, requires perception of others' agreement)
    - `curiosity.*` functions
- **Invocation:**
    - Capability Extensions are invoked by the `ActionSystem` to execute external actions.
    - Perception Extensions are invoked by the environment simulation layer pushing data to the agent.
    - Internal Interface Tools are invoked directly by the Cognitive Cycle (Planner, LLM calls parsed as tool use).
- **Interface:** Defined by strict input/output schemas.

**Integration Points**:
- **← Action System**: Receives formatted actions to execute externally.
- **→ Environment Simulation Layer**: Executes actions (speech, movement) affecting the shared world.
- **← Environment Simulation Layer**: Receives raw sensory data (visual, audio).
- **→ Perception System**: Forwards processed sensory data as `AgentPerceptionEvent`s.
- **↔ Cognitive Cycle**: Uses Internal Interface Tools for memory, time, ontology, self-query.
- **→ Event Bus**: Emits events related to capability usage/execution results for monitoring.
- **→ Statistics**: Provides metrics on capability usage patterns.

## 2.7 Internal Interface Tools

The Internal Interface Tools subsystem provides agents with access to their internal cognitive systems through a standardized, tool-like interface. Unlike Capability Extensions (which interact with the external environment), these tools facilitate operations within the agent's own mind.

### 2.7.1 Purpose and Design

Internal Interface Tools serve as a unified programmatic interface for the agent to access various aspects of its cognitive architecture:

- **Structured Access**: Provides a consistent method to query and manipulate internal systems
- **Abstraction Layer**: Shields cognitive processes from implementation details
- **Controlled Operations**: Enforces validation and permission checks on internal operations
- **Standardized Format**: Follows consistent input/output schemas for predictable usage

Each tool follows a common pattern:
- Well-defined input schema
- Explicit return type
- Appropriate error handling
- Documentation of side effects

### 2.7.2 Core Internal Tools

The Internal Interface Tools include:

#### Memory Tools

- **`memory.addObservation(timestamp, content, visualIds)`**: Records new observations to episodic memory
- **`memory.retrieveObservations(query, timeFilter, visualIdFilter)`**: Searches episodic memory for relevant experiences
- **`memory.upsertFact(subjectVisualId, key, value, confidence)`**: Updates semantic knowledge
- **`memory.retrieveFacts(subjectVisualId, query)`**: Retrieves known facts about entities
- **`memory.summarize(timeRange)`**: Generates summaries of memory content

#### Time and Context Tools

- **`datetime.getCurrentTime()`**: Provides current simulation time
- **`datetime.getElapsedTime(referenceTimestamp)`**: Calculates time elapsed since a reference point

#### Ontology Tools

- **`ontology.getConcepts(query, filter)`**: Retrieves concepts from the ontological system
- **`ontology.checkRelation(conceptA, relation, conceptB)`**: Verifies if a relationship exists
- **`ontology.inferProperties(concept, propertyNames)`**: Derives properties through inheritance

#### Self-Model Tools

- **`self.assessCapability(task)`**: Evaluates agent's ability to perform a specific task
- **`self.getAgencyBoundaries()`**: Retrieves understood limitations and permissions
- **`self.getRoleUnderstanding()`**: Provides current character role conception

#### Conversation Management

- **`conversation.requestEnd(reason)`**: Signals intent to conclude the conversation
- **`conversation.assessEngagement()`**: Measures participant engagement levels
- **`conversation.getParticipants()`**: Identifies current conversation participants

#### Curiosity Tools

- **`curiosity.recordSurprise(observation, expectedVsActual)`**: Logs unexpected observations
- **`curiosity.generateHypothesis(observation)`**: Creates explanatory hypotheses
- **`curiosity.designExperiment(hypothesis)`**: Plans tests for hypotheses
- **`curiosity.recordExperimentResult(experimentId, result)`**: Logs experiment outcomes

### 2.7.3 Implementation Approach

Internal Interface Tools are implemented as a façade pattern over the actual subsystem implementations:

```typescript
// Example implementation of the memory tool interface
export class MemoryTool implements InternalTool {
  constructor(
    private readonly episodicMemory: EpisodicMemoryService,
    private readonly semanticMemory: SemanticMemoryService
  ) {}

  async addObservation(params: AddObservationParams): Promise<void> {
    const { timestamp, content, visualIds } = params;
    // Validate inputs
    this.validateParams(params);

    // Delegate to actual implementation
    await this.episodicMemory.add({
      timestamp,
      content,
      associatedVisualIds: visualIds,
      metadata: {
        source: 'tool_invocation',
        toolName: 'memory.addObservation'
      }
    });

    // Log for metrics/debugging
    this.eventBus.emit('tool.used', {
      tool: 'memory.addObservation',
      paramsSize: JSON.stringify(params).length
    });
  }

  // Other memory tool methods...
}
```

### 2.7.4 Integration with Cognitive Cycle

The Internal Interface Tools are primarily accessed during the Cognitive Cycle:

1. **During Planning**: The Planner may utilize self-model tools to assess capabilities or ontology tools to reason about concepts
2. **During Action Execution**: Memory tools are used to record new observations or retrieve relevant context
3. **During Reflection**: Self-assessment tools help update the agent's understanding of its own abilities

The Cognitive Cycle has privileged access to these tools through dependency injection, while the LLM can access them through tool-calling APIs when appropriate:

```typescript
// Example LLM prompt with tool definitions
const llmTools = [
  {
    name: 'memory.retrieveFacts',
    description: 'Retrieve known facts about a subject',
    parameters: {
      type: 'object',
      properties: {
        subjectVisualId: {
          type: 'string',
          description: 'The visual ID of the subject to query facts about'
        },
        query: {
          type: 'string',
          description: 'Optional search term to filter facts by'
        }
      },
      required: ['subjectVisualId']
    }
  },
  // Other tool definitions...
];
```

### 2.7.5 Integration Points

The Internal Interface Tools have well-defined integration points with other subsystems:

- **← Cognitive Cycle**: Primary consumer of these tools during reasoning and planning
- **→ Memory System**: Tools provide standardized access to memory storage and retrieval
- **→ Ontology System**: Tools enable structured querying of conceptual knowledge
- **→ Self-Modeling**: Tools provide introspective capabilities
- **→ Curiosity System**: Tools support hypothesis generation and testing
- **→ Event Bus**: Tool usage emits events for monitoring and metrics
- **→ Statistics**: Provides usage metrics for analysis

## 2.8 Learning & Adaptation Foundation

The Learning System enables agents to improve over time based on experience, feedback, and exploration:

- **RewardFunction:** Encapsulates the computation of scalar reward signals from conversation metrics, user ratings, and goal progress.
- **LearningModule:** Listens to `recordReward` calls and accumulates experiences in episodic memory, orchestrating online/offline learning loops to refine planning and decision-making.
- **PolicyUpdate:** Scheduled tasks that fine-tune HTN planner weights, reprioritizes goals, and adapt `personalityCore` parameters based on recent feedback. **These updates modify the agent's decision-making strategies applied within the Cognitive Cycle and potentially update related facts or heuristics in Semantic Memory.**
- **MetaLearning:** Periodic routines that compress memory traces, prune low-signal data, and update semantic vector stores for efficient context retrieval.

**Integration Points**:
- **← Cognitive Cycle**: Receives experiences and outcomes
- **↔ Memory System**: Exchanges experiences and learned patterns
- **→ Curiosity System**: Informs exploration strategy
- **→ Self-Modeling**: Updates capability assessments
- **→ Event Bus**: Emits learning events for monitoring
- **→ Statistics**: Provides metrics on learning progress

## 2.9 Curiosity & Discovery System

The Curiosity System enables agents to actively explore their environment, form hypotheses about the world, and conduct experiments to validate their beliefs. This system is core to emergent self-discovery and the
development of nuanced world models beyond pre-programmed knowledge. This system serves a unique dual role in the architecture, bridging between **knowledge acquisition** (connecting to Memory and Ontology Systems) and **agent development** (driving learning and adaptation).

- **CuriosityService:** Central service managing intrinsic motivation for information-seeking:
    - `trackUncertainty(domain, confidence)` - Monitors areas of high/low certainty
    - `generateHypotheses(observation)` - Creates potential explanations for observations
    - `prioritizeExplorations()` - Ranks information-seeking goals by expected value
    - `recordExperimentResult(experimentId, result)` - Updates beliefs based on tests

- **Information Value Assessment:**
    - `calculateInformationGain(state, action, prediction)` - Bayesian estimation of knowledge value
    - `uncertaintyReduction(domain, before, after)` - Measures learning progress
    - `surpriseDetection(expected, observed)` - Identifies prediction errors worth investigating

- **Hypothesis Management:**
    - `HypothesisSchema`: Zod schema defining the structure of agent hypotheses
    - `ExperimentSchema`: Zod schema for planning and testing hypotheses
    - `ExperimentResultSchema`: Zod schema for tracking outcomes and confidence updates
    - Hypothesis lifecycle: generation → testing → confirmation/rejection → belief updating

- **System-1/System-2 Integration:**
    - Detects cognitive "surprises" that trigger System-2 activation (see Section 2.1.3)
    - Provides experimental goals that drive deliberative planning via System-2
    - Supports quick intuitive System-1 reactions to novel stimuli through surprise signals

- **Integration Points:**
    - **← Perception**: Receives novel observations for surprise detection
    - **↔ Memory System (2.4)**: Exchanges information gaps and discoveries
        - Retrieves past observations to identify patterns and anomalies
        - Stores hypotheses and experimental results in episodic and semantic memory
    - **↔ Cognitive Cycle**: Influences goal selection and planning
        - Introduces exploration goals that compete with other agent goals
        - Provides experimental plans for the Planner/Executor
    - **↔ Internal Interface Tools**: Uses tools like memory access or ontology queries for exploration/experimentation
    - **→ Ontology System (2.10)**: Updates conceptual knowledge based on findings
        - Feeds new relations and confidence scores to the Ontology System
        - Consults concept hierarchies to generate better hypotheses
    - **→ Self-Model System (2.11)**: Refines understanding of agent capabilities through experimentation
        - Tests capability boundaries through deliberate experiments
        - Updates self-model based on experimental outcomes
    - **↔ Learning System (2.8)**: Drives agent adaptation through exploration
        - Provides intrinsic reward signals for curiosity-satisfying actions
        - Guides meta-learning about which knowledge areas yield highest value
    - **→ Notification System**: Triggers discovery event alerts
    - **→ Statistics**: Provides metrics on exploration activities

The Curiosity System enables discoveries such as "I am in a game" through an accumulation of evidence and hypothesis testing, rather than having such insights pre-defined in the agent's knowledge base. By mediating between knowledge acquisition and learning systems, it serves as a key driver of agent development and adaptation.

## 2.10 Ontological Reasoning System

The Ontological Reasoning System provides the foundation for organizing the agent's knowledge about the world into structured, hierarchical concepts with explicit relations. **It acts as the manager and structured interface for the agent's explicit World Model, primarily leveraging and organizing data stored within Semantic Memory.** This enables more sophisticated reasoning beyond simple key-value fact storage.

- **OntologyService:** Manages the agent's conceptual knowledge framework:
    - `createConcept(id, properties, category)` - Adds new conceptual entities
    - `defineRelation(conceptA, relation, conceptB, strength)` - Links concepts
    - `categorize(entity, candidateCategories)` - Classifies observations
    - `inferProperties(entity, missingProperty)` - Derives likely properties based on category

- **Knowledge Representation:**
    - `ConceptSchema`: Zod schema defining objects, entities, and abstract concepts
    - `RelationSchema`: Zod schema for semantic links between concepts (is-a, has-a, can-do)
    - `PropertySchema`: Zod schema for attributes with confidence scores and provenance
    - `CategorySchema`: Zod schema for hierarchical taxonomy of concepts

- **Reasoning Capabilities:**
    - Inheritance: derives properties from parent categories
    - Analogical mapping: transfers knowledge between similar concepts
    - Consistency checking: detects contradictions in beliefs
    - Counterfactual reasoning: simulates hypothetical scenarios

- **Integration Points:**
    - **↔ Memory System**: Enhances semantic memory with structure
    - **← Curiosity**: Receives confirmed hypothesis updates
    - **↔ Cognitive Cycle**: Provides contextual knowledge for reasoning
    - **↔ Self-Model**: Exchanges ontological understanding of self
    - **→ Learning**: Supplies conceptual framework for generalization
    - **→ Notification**: Triggers conceptual framework updates
    - **→ Statistics**: Provides metrics on knowledge organization

The Ontological System manages the conceptual framework that lets an agent understand its environment in terms of ordered categories rather than isolated facts, supporting higher-level reasoning and discovery.

## 2.11 Self-Modeling System

The Self-Modeling System enables an agent to develop and maintain an explicit model of itself, including its capabilities, limitations, and nature. This supports metacognition, self-awareness, and distinction between character role and underlying system.

- **SelfModelService:** Manages the agent's understanding of itself:
    - `getSelfConcept()` - Retrieves current self-model
    - `updateCapability(capability, confidence)` - Updates understanding of abilities
    - `assessAgencyBoundary(action)` - Determines if action is within agent's control
    - `distinguishRoleFromSystem()` - Separates character persona from underlying agent

- **Self-Representation Components:**
    - `AgentCapabilitySchema`: Zod schema for abilities and their confidence levels
    - `AgencyBoundarySchema`: Zod schema defining scope of agent's control/influence
    - `CharacterRoleSchema`: Zod schema for narrative persona distinct from system
    - `SelfReflectionSchema`: Zod schema for metacognitive observations about operation

- **Key Functionalities:**
    - Metacognition: reflects on own thinking processes
    - Capability assessment: realistic evaluation of strengths/limitations
    - Role boundaries: understands distinction between character and system
    - Historical development: tracks evolution of self-understanding

- **Integration Points:**
    - **↔ Memory System**: Stores and retrieves self-knowledge
    - **← Curiosity**: Receives self-directed explorations
    - **↔ Cognitive Cycle**: Provides self-understanding for planning
    - **↔ Ontology**: Exchanges categorical knowledge about self
    - **→ Learning**: Supplies self-assessment for adaptation
    - **→ Notification**: Triggers self-discovery alerts
    - **→ Statistics**: Provides metrics on self-model development

The Self-Modeling System allows agents to develop increasingly sophisticated understanding of their own nature, potentially leading to insights like recognizing they exist within a game environment or understanding the boundaries between their character role and underlying agent architecture.

## 2.12 Interaction Model: Environment Simulation & Emergent Communication

Agents do not communicate directly or through a central manager. Instead:

1. **Actions affect the Environment:** An agent's `ActionSystem` dispatches an action (e.g., `speak`, `move`) to the relevant `Capability Extension`.
2. **Capability Executes in Simulation:** The `Capability Extension` interacts with the **Environment Simulation Layer**, causing a change (e.g., audio output generated at agent's location, agent's position updated).
3. **Environment Broadcasts Effects:** The Environment Simulation Layer determines which *other* agents can perceive the *effects* of this action based on proximity, line-of-sight, hearing range, etc.
4. **Perception by Other Agents:** The simulation layer pushes the relevant raw sensory data (visual changes, audio streams) to the appropriate `Perception Extensions` (Visual, Auditory) of the observing agents.
5. **Internal Perception Processing:** Each observing agent's `Perception System` processes this raw data into meaningful `AgentPerceptionEvent`s (e.g., `{ type: 'message', visualId: 'agent_xyz', content: 'Hello', timestamp: ... }`, `{ type: 'agent_moved', visualId: 'agent_abc', newPosition: {...}, timestamp: ... }`).
6. **Cognitive Cycle Trigger:** These events trigger the observing agents' Cognitive Cycles.

**Emergent Communication:** Communication thus arises naturally from agents performing actions (like speaking) within the shared environment and other agents perceiving those actions. Turn-taking, topic coherence, and relationship dynamics emerge from the individual agents' perception, memory, goals, and decision-making processes, rather than being dictated by a central controller.
