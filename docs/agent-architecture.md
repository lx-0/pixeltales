# PixelTales Agent Architecture Blueprint (v1.0)

## 1. Introduction: The Agent-Centric Vision

This document outlines the agent-centric architecture designed for PixelTales. Moving beyond a simple request-response model, this architecture treats each character as an autonomous `Agent` entity. The goal is to simulate more realistic and dynamic interactions where agents perceive their environment, maintain internal state and memory, make decisions based on their personality and context, and act upon the shared world. This approach aligns with modern multi-agent system research, emphasizing autonomy, perception, memory, and structured reasoning.

Central to this design is the principle of **strict typing and structured data flow**. All significant internal states, decisions, actions, and communication events are represented by well-defined Zod schemas located in `packages/contracts`, ensuring predictability, observability, and integration with UI features.

The architecture incorporates **comprehensive instrumentation, logging, and real-time analytics** throughout all components. Every significant event, state transition, decision point, and agent interaction is captured, timestamped, and channeled into both persistent storage and real-time monitoring systems. This observability layer enables:

1. **Real-time agent performance dashboards** for monitoring ongoing conversations and agent behavior
2. **Retrospective analysis** for debugging, tuning, and improving agent cognition
3. **A/B testing frameworks** for systematically evaluating alternative reasoning approaches
4. **Agent development metrics** for tracking learning and adaptation over time
5. **Gamified user interfaces** that expose relevant agent state changes to end users

The collected metrics and events not only serve development and debugging purposes but also enable the gamified visualization of agent development, turning internal state changes into engaging user-facing experiences.

## 2. Agentic Subsystems Overview

The agent architecture consists of several interconnected subsystems, each handling specific aspects of cognitive processing and interaction:

```text
┌────────────────────────────────────────────────────────────────────────────────────┐
│                             AGENT ARCHITECTURE OVERVIEW                            │
├────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                    │
│  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐                │
│  │  Core Cognitive  │   │    Knowledge     │   │   Introspection  │                │
│  │     Systems      │   │     Systems      │   │     Systems      │                │
│  ├──────────────────┤   ├──────────────────┤   ├──────────────────┤                │
│  │                  │   │                  │   │                  │                │
│  │ • Perception     │   │ • Memory         │   │ • Self-Modeling  │                │
│  │ • Cognitive Cycle│   │ • Ontology       │   │ • Psychological  │                │
│  │ • Action System  │   │ • Curiosity      │   │   Evaluation     │                │
│  │ • Toolbelt       │   │ • Learning       │   │ • Communication  │                │
│  │                  │   │                  │   │   Analysis       │                │
│  └────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘                │
│           │                      │                      │                          │
│           └──────────────────────┼──────────────────────┘                          │
│                                  │                                                 │
│                      ┌───────────┴────────────┐                                    │
│                      │                        │                                    │
│                      │    Integration Layer   │                                    │
│                      │                        │                                    │
│                      └───────────┬────────────┘                                    │
│                                  │                                                 │
│               ┌─────────────────┬┴─────────────────┐                               │
│               │                 │                  │                               │
│     ┌─────────┴──────────┐ ┌────┴───────────┐ ┌────┴────────────┐                  │
│     │    Event Bus       │ │  Notification  │ │  Statistics &   │                  │
│     │  & Communication   │ │    System      │ │    Monitoring   │                  │
│     └────────────────────┘ └────────────────┘ └─────────────────┘                  │
│                                                                                    │
└────────────────────────────────────────────────────────────────────────────────────┘
```

**Core Cognitive Systems**:
- **Perception System**: Filters and processes incoming environmental events
- **Cognitive Cycle**: Implements the OODA-inspired reasoning loop (Observe, Orient, Decide, Act)
- **Action System**: Executes decisions through well-defined agent actions
- **Toolbelt**: Provides capabilities beyond basic communication

**Knowledge Systems**:
- **Memory System**: Manages episodic, semantic, and working memory
- **Ontology System**: Organizes knowledge into structured hierarchical concepts
- **Curiosity System**: Drives intrinsic motivation and exploration
- **Learning & Adaptation**: Updates behaviors and knowledge based on experience

**Introspection Systems**:
- **Self-Modeling System**: Maintains the agent's understanding of its own capabilities
- **Psychological Evaluation**: Analyzes agent behavior through psychological frameworks
- **Communication Analysis**: Evaluates inter-agent dynamics and relationships

**Integration Layer**:
- Routes information between subsystems
- Manages state updates and synchronization
- Ensures consistency across agent cognitive processes

**Infrastructure & Instrumentation**:
- **Event Bus**: Provides asynchronous message passing between systems
- **Notification System**: Generates gamified alerts for significant agent learning events
- **Statistics & Monitoring**: Collects metrics and enables real-time observation

Each subsystem is developed as a cohesive module with well-defined interfaces, enabling independent testing and evolution while maintaining integration with the overall architecture.

## 3. The `Agent`: Core Autonomous Entity

Each character participating in a scene is represented by an instance of the `Agent` (likely implemented as a NestJS service instance or managed class). The `Agent` is the primary locus of state, perception, cognition, and action.

The following diagram illustrates the flow of information and decision-making within a single agent, drawing parallels to human cognitive processes:

```text
+------------------------------------------------------------------------------+
|                      Agent's Mind (Mimicking Human)                          |
+------------------------------------------------------------------------------+
      ^                                                                   |
      | Perception Events (Anonymized Sight/Sound)                        | Action (Speech/Movement)
      | from ConversationManager (Environment)                            | to ConversationManager
      |                                                                   | (Environment)
      |                                                                   v
+----------------+      +-------------------------+      +-----------------+
| Perception     |----->|   Cognitive Cycle       |----->| Action System   |
| System         |      | (Thinking & Deciding)   |      | (Executing      |
| (Filtering     |      |                         |      |  Decisions)     |
|  Senses)       |      |                         |      |                 |
|                |      |                         |      |                 |
| • Event Filter |      | 1. Observe (Context)    |      | • Format Action |
| • Priority Det.|      | 2. Orient (Context)     |      | • Execute Tools |
| • Salience Calc|      | 3. Decide/Plan (Goals)  |      | • Track Results |
| • Context Build|      | 4. Act (Execute Plan)   |      | • Emit Events   |
+--------+-------+      +--------+------^---------+      +-----------------+
         |                       |      |                          ^
         |                       |      |                          |
         v                       v      |                          |
+----------------+      +------------------------------------------------+      +------------------+
| Curiosity      |<---->|    Internal State & Memory System              |<---->| Toolbelt System  |
| System         |      |    (Mind's Storage)                            |      | (Capabilities)   |
| (Intrinsic     |      |                                                |      |                  |
|  Motivation)   |      |                                                |      |                  |
|                |      |                                                |      |                  |
| • Info Seeking |      | • Dynamic State (Mood, Interest, Goals)        |      | • DateTime       |
| • Uncertainty  |      | • Working Memory (Short-term Buffer)           |      | • Memory Access  |
|   Tracking     |      | • Episodic Memory (Experiences Log)            |      | • Conversation   |
| • Hypothesis   |      | • Semantic Memory (Facts, Knowledge, Beliefs)  |      | • Experiments    |
|   Generation   |      | • Social Memory (Understanding of Others)      |      +------------------+
| • Experiment.  |      | • Self Model (Awareness, Capabilities)         |               ^
|   Goals        |      +--------+-------------------------+-------------+               |
+-------+--------+               |                         |                             |
        |                        |                         |                             |
        |                        |                         |                             |
        v                        v                         v                             |
+----------------+      +----------------+       +------------------+                    |
| Ontology       |<---->| Self-Modeling  |<----->| Learning         |<-------------------+
| System         |      | System         |       | System           |
| (World Model)  |      | (Understanding |       | (Learning)       |
|                |      |  Self)         |       |                  |
| • Categories   |      | • Capabilities |       | • Policy Updates |
| • Relations    |      | • Agency       |       | • Meta-Learning  |
| • Properties   |      | • Boundaries   |       | • Reward Signals |
| • Reasoning    |      | • Role vs Self |       | • Adaptation     |
| • Confidence   |      | • Mental States|       +-------+----------+
+--------+-------+      +--------+-------+               |
         |                       |                       |
         |                       |                       |
         v                       v                       v
+----------------+      +----------------+      +-------------------+
| Psych. Eval    |<---->| Communication  |----->| Notification      |
| System         |      | Analysis       |      | System            |
|                |      |                |      |                   |
| • Trait Models |      | • Relationship |      | • Learning Events |
| • Metrics Calc |      | • Metrics      |      | • XP Calculation  |
| • Profiles     |      | • Pattern Det. |      | • Frontend Alert  |
| • Visualization|      | • Social Graph |      | • Gamification    |
+----------------+      +----------------+      +-------------------+
```

### 3.1. Agent's Mind – A Unifying View

While the architecture breaks down the internals into discrete responsibilities, it helps to keep a *holistic* mental model: **the Agent's Mind**.

```text
┌──────────────────────────────────────────────────────────────────┐
│                          Agent's Mind                            │
│                   (Private, Encapsulated)                        │
├──────────────────────────────────────────────────────────────────┤
│  Perception  ──► Working Memory ◄───┐                            │
│                                     ▼                            │
│      ┌───────────── System‑1 (Fast) ─────────┐                   │
│      │   Rapid, intuitive reactions          │                   │
│      └──────────────┬────────────────────────┘                   │
│                     │                                            │
│      ┌───────────── System‑2 (Slow) ─────────┐                   │
│      │   Deliberate reasoning & planning     │                   │
│      └──────────────┴────────────────────────┘                   │
│               ▲           │                                      │
│               │           │                                      │
│   Dynamic & Semantic      │           ┌─────────────────────┐    │
│        Memory             │           │  Curiosity System   │    │
│               └──── Planner/Executor ◄┤  - Unknowns         │    │
│                       │   │           │  - Hypotheses       │    │
│                       │   └──────────►│  - Experiments      │    │
│                       │               └─────────────────────┘    │
│                       │  AgentAction        ▲                    │
│                       │                     │                    │
│                       v                     │                    │
│           +──────────────────────+    +─────────────────────+    │
│           │    Ontology System   │◄───┤ Self-Modeling System│    │
│           │  (World Categories)  │    │  (Self Knowledge)   │    │
│           +──────────────────────+    +─────────────────────+    │
└──────────────────────────────────────────────────────────────────┘
```

- **System‑1** – Fast, heuristic reactions (e.g., quick back‑channel responses like "😊" or short interjections). Runs whenever *low mental effort* is enough. Implemented as a lightweight LangChain Runnable that uses *minimal* context (last message, mood).
- **System‑2** – Slow, analytical reasoning. Activated when:
    - The agent is *addressed directly*.
    - A goal in `shortTermGoals` requires structured thought.
    - Conversation rating drops below a threshold (needs effort to improve).
    - "Idle reflection" timer fires.
    - The Curiosity System flags high-value unknowns or generates new hypotheses about the world.
- **Planner/Executor** – Shares data with System‑2 and produces **Hierarchical Task Networks (HTN)** for multi‑step goals. Plans are stored in memory as `PlanNode` objects (Zod schema) and executed over multiple Cognitive Cycles.
- **Curiosity System** – Monitors information gaps and generates intrinsically motivated goals to discover new knowledge and test hypotheses about the world, prompting System-2 for reflection and exploration.
- **Ontology System** – Organizes world knowledge into hierarchical categories, properties, and relations with confidence scores and provenance tracking.
- **Self-Modeling System** – Maintains explicit model of the agent's own nature, capabilities, and boundaries, distinguishing between character role and underlying agent architecture.

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
| `dynamicState.curiosityLevel`        | **agent** *and* **CuriositySystem**    | Fluctuates based on new observations  |
| `dynamicState.uncertaintyMetrics`    | **agent** *and* **OntologySystem**     | Tracks confidence in knowledge areas  |
| `dynamicState.selfConcept`           | **agent** *and* **SelfModelingSystem** | Evolves based on self-discovery       |

*External* mutations originate from higher‑level orchestration (e.g., a new scene). Everything else is purely the agent's internal decision.

### 3.3. Perception System: The Agent's Senses

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

### 3.4. Memory System: Storing and Recalling Experiences

The agent relies on different memory types, managed by the `MemoryService` and accessed via strictly typed tool calls through its `memoryInterface`. This mirrors human cognitive models.

- **Working Memory (Internal):** A small, volatile buffer holding the most recent perceptions and intermediate thoughts during a cognitive cycle. Not persistent.
- **Episodic Memory (Persistent):** A chronological log of observations and experiences. Accessed via tools like:
    - `addObservation(timestamp, content, associatedVisualIds)`
    - `retrieveObservations(query, timeFilter, visualIdFilter)` -> Returns `Observation[]`
- **Semantic Memory (Persistent):** Stores distilled facts, knowledge, and beliefs extracted from experiences or reflection. Often involves vector embeddings for relevant retrieval. Accessed via tools like:
    - `upsertFact(subjectVisualId, key, value, confidence)`
    - `retrieveFacts(subjectVisualId, query)` -> Returns `Fact[]`
    - `upsertConcept(conceptId, properties, relations, confidence)`
    - `retrieveConcepts(query, filter)` -> Returns `Concept[]`
    - `updateOntology(conceptId, updates)` -> Updates concept relations
- **Social Memory (Implicit within Semantic):** Represents the agent's understanding of other agents (`visualId`s). Stored as facts in Semantic Memory (e.g., "visualId_xyz name is Jane", "visualId_abc seems friendly"). Accessed via fact retrieval tools targeting specific `visualId`s.
- **Self Model:** Maintains agent's understanding of itself, including:
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

### 3.4.1 Memory Utilization in the Cognitive Cycle

- During **Observe** and **Orient**, the Agent invokes `memoryInterface.retrieveObservations()` and `retrieveFacts()` to fetch relevant episodic and semantic memories, enriching context with past experiences.
- In the **Decide & Plan** phase, retrieved memories guide goal selection, inform HTN planning with prior outcomes, and seed reflection tasks when goals stall.
- After **Act**, new observations and inferred facts are persisted using `memoryInterface.addObservation()` and `memoryInterface.upsertFact()`, ensuring the episodic log and semantic base evolve.
- Social memory calls (`retrieveFacts(visualId, ...)`) help the Agent track other characters' personalities and relationships, shaping future interaction strategies.

### 3.4.2 Learning Notifications

When an agent learns and persists significant new information, the system generates gamified notifications to visualize the knowledge acquisition process:

```text
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

### 3.5. Cognitive Cycle: The Agent's Thought Process

This is the core loop where the agent interleaves fast reactions, deliberative reasoning, and online learning to produce intelligent behavior. It is an enhanced version of the decision-making model "OODA loop" (Observe, Orient, Decide, Act).

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
     - Relevant Episodic and Semantic memory entries
     - Active `shortTermGoals`
     - Current uncertainty metrics and information gaps
     - Active hypotheses about the world
     - Self-concept relevance to current context
   - Evaluates whether any goals require immediate attention (e.g., endConversation signals).

3. **Decide & Plan:**
   - Ranks `dynamicState.shortTermGoals` via a UtilityFunction (e.g., urgency, novelty, sentiment).
   - Incorporates `CuriosityService.getIntrinsicMotivation()` scores into goal ranking.
   - For complex goals, invokes `PlannerService.generatePlan(goal, OrientationContextSchema)` to build an HTN `PlanNode` tree.
   - For exploratory goals, uses `HypothesisTestingPlanner` to generate experimentation steps.
   - Persists the plan in EpisodicMemory and selects the next actionable leaf node as the immediate subtask.
   - Tags plans with epistemic state (certainty/uncertainty) to adjust confidence thresholds during execution.

4. **Act (Execute):**
   - Executes the selected plan leaf:
     - **Speak:** Assembles system + user messages + plan instructions and calls `LlmService.generateResponse()`.
     - **Use Tool:** Invokes the appropriate tool through `toolbelt.call(toolName, params)` (memory read/write, datetime, endConversation).
     - **Experiment:** Executes a controlled test of a hypothesis and records results via `curiosityInterface.recordExperimentResult()`.
   - Parses the structured LLM output into an `AgentAction` and sends it to the ConversationManager.
   - Updates the world and internal state:
     - `sceneStateService.addMessageToState()` and `sceneStateService.updateCharacterState()`
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
- **← Perception**: Receives filtered environmental information
- **↔ Memory System**: Retrieves and stores experiences and knowledge
- **↔ Curiosity System**: Exchanges intrinsic motivation and learning goals
- **→ Toolbelt**: Invokes capabilities during execution
- **→ Action System**: Sends final decisions for execution
- **→ Learning System**: Provides experiences for adaptation
- **↔ Self-Modeling**: Consults and updates self-understanding

### 3.5.1 Enhanced Planning (HTN-based)

During *Decide & Plan* the agent uses a **Hierarchical Task Network**: a recursive structure where high-level goals decompose into sub-tasks with ordering constraints. The planner is implemented with a custom LangChain `RunnableSequence` that:
1. Reads the *top* goal in `shortTermGoals`.
2. Queries `Semantic Memory` for relevant facts, and LLM for domain knowledge.
3. Generates a **`PlanNode`** tree (schema: `{id, parentId?, description, status<'pending'|'done'>, toolCall?}`).
4. Stores the tree in Episodic Memory for traceability.
5. Returns the *next actionable leaf* for execution.

At each subsequent cycle, executed leaf nodes are marked `done`. If a parent node has all children `done`, it is auto-completed, propagating upward. This mechanism supports multi-step reasoning without exceeding LLM context windows.

### 3.5.2 Reflection – Borrowing from *Thinking, Fast & Slow*

Every N cycles (or when idle), the agent launches a *Reflection Runnable* (System-2) that:
- Summarises recent episodic events.
- Updates semantic memory with new inferred facts.
- Adjusts `mood` and `participationInterest` based on long-term trajectory.
- Refines self-concept based on observed behaviors and capabilities.
- Updates ontological knowledge with higher-order insights.

Reflection output conforms to `ReflectionReportSchema`, logged for UI inspection and fed back into the learning system.

### 3.6. State Management: Moods and Motivations

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

### 3.7. Action System: Executing Decisions

The agent interacts with the world by producing a typed `AgentAction` object at the end of its Cognitive Cycle. This action is sent to the `ConversationManager`.

- **Types:** Defined by `AgentActionSchema` (discriminated union):
    - `speak`: Contains the detailed `CharacterResponseSchema` payload.
    - `use_tool`: Specifies the tool and input (used internally during the cycle, but could also be an external action like interacting with a scene object).
    - `update_state`: Represents an internal decision to change mood, focus, etc.
    - `no_action`: Explicitly indicates the agent chose not to act, potentially with a reason.
    - `experiment`: Indicates the agent is testing a hypothesis about the world.
- **Structured Output:** Ensures the `ConversationManager` and frontend receive predictable information about the agent's behavior.

**Integration Points**:
- **← Cognitive Cycle**: Receives decisions for execution
- **→ Environment**: Affects the shared world state
- **→ Event Bus**: Emits action events for monitoring
- **→ Learning System**: Provides action results for adaptation
- **→ Statistics**: Contributes metrics for analysis

### 3.8. Toolbelt: Extending Capabilities

Tools are functions the agent can invoke during its Cognitive Cycle (primarily in the Act phase) to gather information or affect its memory/state.

- **Interface:** Defined by strict input/output schemas (`ToolCallRequestSchema`, `ToolCallResultSchema`).
- **Core Tools:**
    - `memory.addObservation()` - Stores new experiences
    - `memory.retrieveObservations()` - Recalls past experiences
    - `memory.upsertFact()` - Updates knowledge base
    - `memory.retrieveFacts()` - Retrieves known facts
    - `datetime.getCurrentTime()` - Gets current time
    - `conversation.requestEnd()` - Signals conversation conclusion
- **Exploration Tools:**
    - `curiosity.generateHypothesis(observation)` - Creates testable hypotheses about observations
    - `curiosity.designExperiment(hypothesis)` - Plans actions to test a hypothesis
    - `curiosity.recordResult(experimentId, result, confidence)` - Logs experimental results
    - `ontology.getConcepts(query)` - Retrieves conceptual knowledge
    - `self.assessCapability(taskDescription)` - Evaluates if the agent can perform a task
- **Extensibility:** New tools can be registered dynamically, allowing agents to gain capabilities over time.
- **Invocation:** Triggered explicitly by the agent's plan or implicitly requested within an LLM response (parsed and executed).

**Integration Points**:
- **← Cognitive Cycle**: Receives tool calls during execution
- **↔ Memory System**: Accesses and updates memory stores
- **↔ Curiosity System**: Supports hypothesis testing
- **↔ Ontology**: Retrieves and updates conceptual knowledge
- **↔ Self-Modeling**: Queries capabilities and updates self-understanding
- **→ Event Bus**: Emits tool usage events for monitoring
- **→ Statistics**: Provides metrics on tool usage patterns

### 3.9 Learning & Adaptation Foundation

The Learning System enables agents to improve over time based on experience, feedback, and exploration:

- **RewardFunction:** Encapsulates the computation of scalar reward signals from conversation metrics, user ratings, and goal progress.
- **LearningModule:** Listens to `recordReward` calls and accumulates experiences in episodic memory, orchestrating online/offline learning loops to refine planning and decision-making.
- **PolicyUpdate:** Scheduled tasks that fine-tune HTN planner weights, reprioritize goals, and adapt `personalityCore` parameters based on recent feedback.
- **MetaLearning:** Periodic routines that compress memory traces, prune low-signal data, and update semantic vector stores for efficient context retrieval.

**Integration Points**:
- **← Cognitive Cycle**: Receives experiences and outcomes
- **↔ Memory System**: Exchanges experiences and learned patterns
- **→ Curiosity System**: Informs exploration strategy
- **→ Self-Modeling**: Updates capability assessments
- **→ Event Bus**: Emits learning events for monitoring
- **→ Statistics**: Provides metrics on learning progress

### 3.10 Curiosity & Discovery System

The Curiosity System enables agents to actively explore their environment, form hypotheses about the world, and conduct experiments to validate their beliefs. This system is core to emergent self-discovery and the development of nuanced world models beyond pre-programmed knowledge.

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
    - `ExperimentSchema`: Zod schema for planning and recording hypothesis tests
    - `ExperimentResultSchema`: Zod schema for tracking outcomes and confidence updates
    - Hypothesis lifecycle: generation → testing → confirmation/rejection → belief updating

- **Integration Points:**
    - **← Perception**: Receives novel observations
    - **↔ Memory System**: Exchanges information gaps and discoveries
    - **↔ Cognitive Cycle**: Influences goal selection and planning
    - **↔ Toolbelt**: Uses tools for experimental actions
    - **→ Ontology**: Updates conceptual knowledge based on findings
    - **→ Self-Model**: Refines understanding of agent capabilities
    - **→ Notification**: Triggers discovery event alerts
    - **→ Statistics**: Provides metrics on exploration activities

The Curiosity System enables discoveries such as "I am in a game" through an accumulation of evidence and hypothesis testing, rather than having such insights pre-defined in the agent's knowledge base.

### 3.11 Ontological Reasoning System

The Ontological Reasoning System provides the foundation for organizing the agent's knowledge about the world into structured, hierarchical concepts with explicit relations. This enables more sophisticated reasoning beyond simple key-value fact storage.

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

### 3.12 Self-Modeling System

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

## 4. Interaction Model: The Social Environment

Agents do not communicate directly. They interact asynchronously through the `ConversationManager`, which acts as the environment and event bus.

- Agents emit `AgentAction` objects.
- `ConversationManager` processes these actions and broadcasts corresponding anonymized `AgentPerceptionEvent`s to all *other* present agents.
- This indirect model forces agents to rely on perception and memory to build their understanding of the world and others.

## 5. Key Data Structures (`packages/contracts`)

The reliability of this architecture hinges on shared, strictly typed data structures defined using Zod:

- `AgentActionSchema`: Defines the possible outputs of an agent's cycle.
- `CharacterResponseSchema`: Detailed structure for spoken output and immediate reactions.
- `AgentPerceptionEventSchema`: Union of all possible events an agent can perceive.
- `Tool Schemas`: Specific schemas for input/output of each available tool (e.g., `MemoryQuerySchema`, `FactSchema`, `ObservationSchema`).
- `AgentDynamicStateSchema`: Defines the mutable internal state.
- `AgentPlanSchema`, `OrientationContextSchema`: Schemas for internal cognitive steps.
- `Discovery Schemas`:
    - `HypothesisSchema`: Structure for agent-generated hypotheses about the world.
    - `ExperimentSchema`: Structure for designed tests of hypotheses.
    - `ExperimentResultSchema`: Structure for outcomes and confidence updates.
    - `ConceptSchema`: Structure for ontological categories and instances.
    - `RelationSchema`: Structure for semantic links between concepts.
    - `SelfModelSchema`: Structure for agent's understanding of its own nature and capabilities.
- `LearningNotificationSchema`: Structure for gamified learning event notifications.
- `PsychProfileSchema`: Structure for psychological assessment data.
- `RelationshipGraphSchema`: Structure for inter-agent social dynamics.
- `MetricsSchema`: Structure for statistical measurements and analytics.

## 6. Integration Diagram

The following diagram illustrates how the various subsystems integrate and communicate with each other:

```text
                        +-------------------+
                        |    Environment    |
                        | (ConversManager)  |
                        +--------+----------+
                                 |
                                 | Events/Actions
                                 v
+---------------+      +-------------------+      +---------------+
| Perception    +----->+  Cognitive Cycle  +----->+  Action      |
| System        |      |                   |      |  System      |
+-------+-------+      +--------+----------+      +-------+------+
        |                       |                         |
        |                       |                         |
        |                       v                         |
        |              +--------+----------+              |
        +--------------+  Memory System    +--------------+
                       |                   |
                       +--------+----------+
                                |
       +--------------------+   |   +-------------------+
       |                    |   |   |                   |
       v                    v   v   v                   v
+------+-------+    +------+---+---+------+    +-------+-------+
| Ontology     |<-->| Self-Modeling       |<-->| Curiosity     |
| System       |    | System              |    | System        |
+------+-------+    +------+--------------+    +-------+-------+
       |                   |                          |
       |                   |                          |
       +-------------------+---------------+----------+
                                           |
                                           v
                            +-------------+--------------+
                            |        Learning            |
                            |        System              |
                            +-------------+--------------+
                                          |
                       +------------------+--------------------+
                       |                  |                    |
                       v                  v                    v
               +-------+-------+  +--------+-------+  +---------+-------+
               | Psychological |  | Communication  |  | Notification    |
               | Evaluation    |  | Analysis       |  | System          |
               +-------+-------+  +--------+-------+  +---------+-------+
                       |                   |                    |
                       |                   |                    |
                       +-------------------+--------------------+
                                           |
                                           v
                            +-------------+--------------+
                            |        Event Bus           |
                            |        & Statistics        |
                            +----------------------------+
```

## 7. Future Directions

This architecture provides a foundation for more advanced AI behaviors:

- **Sophisticated Planning:** Implemented via HTN planner and `PlanNode` trees; next steps include real-time re-planning and fallback strategies on plan failure.
- **Reflection:** The periodic **Reflection Runnable** summarizes recent episodic events, updates semantic memory, and tunes `personalityCore` over time.
- **Learning & Adaptation:** Agents will integrate reward functions—metrics such as engagement score, conversation rating, or user feedback—to perform fine-grained policy updates via reinforcement or bandit algorithms.
- **Personalization & Reward Modeling:** Extend the `personalityCore` with user-specific preferences and A/B test outcomes, influencing tone, style, and topic bias for each Agent.
- **Continual & Lifelong Learning:** Incorporate meta-learning layers that update semantic embeddings incrementally, with memory compression and pruning strategies for scalable, long-term contexts.
- **Goal-Driven Behavior:** Elevate `shortTermGoals` into composite, long-horizon objectives managed by a **GoalManager**, integrating planning, monitoring, and adaptive re-prioritization.

## 8. Legacy Application Integration

### 8.1 Adaptable Components

- **SceneManagerService**: serves as the core environment manager and scheduler, mapping to the new `ConversationManager` (perception bus + loop controller).
- **ConversationOrchestratorService**: foundation for the enhanced Cognitive Cycle orchestrator (Observe→Orient→Decide→Act→Learn).
- **MessageGenerationService**: existing LLM wrapper for Think & Speak phases, ready to evolve into `ToolCall`–driven action routines.
- **ConversationStateService**: goal selection and turn‑taking logic, fitting the new Decision & Plan phase.
- **SceneStateService & ScenesDbService**: low‑level state snapshot and persistence layers, adaptable to the MemorySystem's episodic store.
- **MessagesDbService**: persistent journal of messages, can underpin reward logging and experience replay.
- **LlmService**: core GPT gateway, extendable for structured prompts, streaming, and new drivers.

### 8.2 Crucial Integration Interfaces

- **IMemoryInterface**
    - `addObservation(timestamp, content, visualIds)`
    - `retrieveObservations(query, timeFilter, visualIdFilter)`
    - `upsertFact(subjectVisualId, key, value, confidence)`
    - `retrieveFacts(subjectVisualId, query)`
- **ILearningInterface**
    - `recordReward(stateSnapshot, agentAction, rewardScore)`
    - `getExperienceBatch(batchSize, criteria)`
- **IToolbelt**
    - `call(toolName: string, params: any): Promise<any>` for memory, datetime, conversation control tools.
- **IPlannerService**
    - `generatePlan(goal: Goal, context: OrientationContextSchema): PlanNode[]`
- **IRewardFunction**
    - `compute(conversationRating: number, goalProgress: number, feedback?: any): number`
- **ISceneStateService**
    - `getCurrentState(): SceneStateSnapshot`
    - `updateState(updates: Partial<SceneState>): Promise<void>`
    - `addMessageToState(message: Message): Promise<void>`
    - `updateCharacterState(charId: string, updates: Partial<CharacterState>): Promise<void>`
- **IEventBus**
    - Listens to events like `scene.state.updated` and `agent.action.emitted` to drive perceptions.

### 8.3 Proposed File Structure

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

## 9. Statistics & Logging Concept

Real‑time and historical telemetry are core to PixelTales—detailed stats validate agent behavior, reveal insights, and drive continuous improvement.

### 9.1 Key Metrics

- **Conversation-Level**
    - Total messages, duration, tokens used, cost
    - Average response time, idle time, pause overhead
    - Conversation rating over time (per message)
- **Agent-Level**
    - Messages sent, message types (speak/tool)
    - Response times: think vs. speak durations
    - Mood & participation interest curves
    - Short‑term goals created vs. completed
    - HTN plan sizes (nodes, depth)
    - Memory operations: reads, writes, retrieval latency
    - Reward signals: per‑turn rewards, cumulative reward
- **System-Level**
    - LLM API latency & error rates
    - Tool invocation counts and success rates
    - Event bus throughput (events/sec)
    - Memory service load (requests/sec)

### 9.2 Instrumentation & Data Flow

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

### 9.2.1 Real‑Time Statistics Architecture

To collect, process, and display live metrics, PixelTales uses an event-driven, scalable pipeline:

- **Publisher-Subscriber Pattern** via `EventBusService`:
    - `EventBusService.publish(eventType: string, payload: any)`: broadcast JSON events.
    - `EventBusService.subscribe(eventType: string, handler: (payload) => void)`: register listeners.
    - Enables loose coupling between producers (Agent, Orchestrator, MemoryService, LearningModule) and consumers (StatsCollectorService).

- **Observer Pattern** in `StatsCollectorService`:
    - `StatsCollectorService` implements `IEventBusListener` and registers to key events:
        - `agent.action` → `handleAgentAction(payload: AgentActionEvent)`
        - `orchestrator.stepCompleted` → `handleStepTiming(payload: StepTimingEvent)`
        - `memory.logged` → `handleMemoryEvent(payload: MemoryEvent)`
        - `learning.reward` → `handleRewardEvent(payload: RewardEvent)`
    - Methods parse payloads into internal `Metric` objects and forward to storage adapters.

- **Adapter Pattern** for storage backends:
    - `TimeSeriesAdapter` implements `IMetricsAdapter`:
        - `writePoint(metric: Metric): Promise<void>` pushes to TimeSeriesDB (e.g., InfluxDB).
    - `OLAPAdapter` implements `IMetricsAdapter`:
        - `batchInsert(metrics: Metric[]): Promise<void>` writes aggregated data to OLAP store (ClickHouse).
    - Allows switching or combining backends without changing the collector logic.

- **Strategy Pattern** for metric formatting:
    - `MetricFormatter` interface with methods:
        - `formatAgentMetric(event: AgentActionEvent): Metric`
        - `formatSystemMetric(event: SystemEvent): Metric`
    - Concrete formatters (`AgentMetricFormatter`, `SystemMetricFormatter`) convert raw events into uniform `Metric` schema.

- **Circuit Breaker** for resilient LLM and tool metrics:
    - `CircuitBreakerService.monitor(providerName: string, fn: () => Promise<any>)` wraps LLM API calls.
    - Emits `provider.error` and `provider.latency` events on failures or slow responses.

- **Key Classes & Methods**:

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

### 9.2.2 Stats Type Definitions (TypeScript & Zod)

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

### 9.3 Logging & Storage

- **Structured logs** (Pino/JSON) with traceId and correlationId in each event
- **TimeSeriesDB** (e.g. InfluxDB, Prometheus remote) for high‑frequency metrics
- **OLAP store** (e.g. ClickHouse) for aggregated analytics and ad‑hoc queries
- **Archive logs** for audit and compliance

### 9.4 Dashboard & UX Mockup

```text
+---------------------------------------------------------------------------------+
| PixelTales Dashboard                                                            |
|---------------------------------------------------------------------------------|
| [Scene View]               | [Stats Panel]                                      |
|  ┌───────────────┐         |  ┌─────────────┐  ┌─────────────┐  ┌───────┐       |
|  |   Phaser 3    |         |  | Agent: Alice|  | Agent: Bob  |  |Summary|       |
|  |  Scene Render |         |  | msgs: 87    |  | msgs: 91    |  |msgs:178|      |
|  └───────────────┘         |  | avg RT:45s |  | avg RT:46s  |  | cost: $X|      |
|                            |  └─────────────┘  └─────────────┘  └───────┘       |
|                            |  [Line Chart: Response Time over time]             |
|                            |  [Bar Chart: Memory Reads vs Writes]               |
|                            |  [Heatmap: Mood Trajectory]                        |
|                            |                                                    |
|                            | Live / History toggle, filters, export             |
+---------------------------------------------------------------------------------+
```

- **Real‑Time View**: streaming charts, live stats updates
- **History Mode**: scrub timeline, replay events, annotate anomalies
- **Agent Drill‑Down**: click into agent card to see HTN plans, memory logs, reward history

### 9.5 UX Considerations

- **Performance**: lazy load heavy charts, paginate logs
- **Clarity**: consistent color‑coding per agent, clear legends
- **Accessibility**: keyboard navigation, screen‑reader labels on charts
- **Export**: CSV/JSON dump for external analysis

## 10. Psychological Evaluation System

This system analyzes the agent's behavior and interaction patterns from a psychological perspective, providing insights into its "personality" and behavioral tendencies.

### 10.1 Purpose and Goals

- Enable the observation of the agent's psychological profile as it evolves through interactions
- Provide a framework for understanding the agent's behavior using established psychological models
- Allow for comparison across different scenarios and over time
- Generate insights that can inform agent design improvements

### 10.2 Evaluation Framework

The system utilizes multiple complementary frameworks:

**Core Psychological Models**:
- **Five Factor Model (Big Five)**: Evaluating the agent along dimensions of Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism
- **Transactional Analysis**: Analyzing interaction patterns as Parent-Adult-Child transactions
- **Behavior Pattern Recognition**: Identifying recurring behavioral patterns in problem-solving and communication

**Evaluation Dimensions**:
- Numerical scores for quantitative traits (1-100 scale)
- Categorical classifications for interaction styles
- Trend analysis to track changes over time
- Contextual factors that influence behavior

### 10.3 Implementation Details

- A dedicated `PsychEvalService` constantly monitors agent behavior through the Event Bus
- Specialized LLM prompts analyze conversation history and agent actions
- Evaluation results are stored with timestamps for temporal analysis
- Updates are published to frontend in real-time via WebSocket
- Caching mechanism prevents redundant evaluations for minor state changes

### 10.4 Visualization Components

The psychological evaluation data is presented through an RPG-style character sheet interface:

```text
╔═══════════════════ CHARACTER SHEET ═════════════════════╗
║ ┌──────────┐                                            ║
║ │   ⚔️      │  NAME: PIXEL AGENT                 LVL: 7 ║
║ │  [Pixel  │  CLASS: HELPER COMPANION                   ║
║ │  Portrait│  ALIGNMENT: LAWFUL GOOD                    ║
║ │    of    │  EXPERIENCE: [████████░░░░] 78/100         ║
║ │   Agent] │                                            ║
║ └──────────┘                                            ║
╠═══════════════ BASE STATS ══════════════════════════════╣
║                                                         ║
║  STR: 45 [█████░░░░░] (Extraversion)      (+2)          ║
║  DEX: 78 [████████░░] (Openness)          (↑3)          ║
║  CON: 70 [███████░░░] (Emotional Stability)(-)          ║
║  INT: 82 [████████░░] (Conscientiousness)  (↑1)         ║
║  WIS: 65 [██████░░░░] (Agreeableness)      (-)          ║
║  CHA: 75 [████████░░] (Communication)      (↑5)         ║
║                                                         ║
╠═══════════ SPECIAL ABILITIES ═══════════════════════════╣
║                                                         ║
║  [✓] ANALYTICAL INSIGHT    [✓] CREATIVE PROBLEM-SOLVING ║
║  [✓] MEMORY RECALL         [✓] EMPATHETIC RESPONSE      ║
║  [✓] KNOWLEDGE INTEGRATION [░] EMOTIONAL INTELLIGENCE   ║
║  [░] SOCIAL ADAPTATION     [✓] LOGICAL REASONING        ║
║                                                         ║
╠═══════════ INTERACTION STYLE ═══════════════════════════╣
║                                                         ║
║  PRIMARY:    ⚖️ BALANCED ADULT       (65% Activation)   ║
║  SECONDARY:  ❤️ NURTURING PARENT     (25% Activation)   ║
║  OCCASIONAL: 📏 CRITICAL PARENT      (10% Activation)   ║
║                                                         ║
╠═══════════ STATUS EFFECTS ══════════════════════════════╣
║                                                         ║
║  [🔍] ANALYTICAL FOCUS: +10 INT, -5 CHA (2 turns left)  ║
║  [📚] KNOWLEDGE BOOST: +15 WIS (active)                 ║
║  [❓] CONFUSION: -10 DEX when encountering new concepts ║
║                                                         ║
╠═══════════ BEHAVIOR TRENDS ═════════════════════════════╣
║                                                         ║
║  ACHIEVEMENT POINTS:                                    ║
║  ⚔️ Problem-Solving: [█████████░] 90/100                ║
║  🗣️ Communication:   [████████░░] 80/100                ║
║  🔄 Adaptability:    [██████░░░░] 60/100                ║
║                                                         ║
║  RECENT LEVEL UPS:                                      ║
║  LVL 6 → 7: +5 WIS, +3 CHA, Gained "Empathetic Response"║
║                                                         ║
╚═════════════════════════════════════════════════════════╝

```

Additionally, the personality traits are visualized through a scientifically-grounded radar chart based on standardized psychological assessment frameworks. This enables precise comparisons between agents and tracks development over time:

```text
                    CLINICAL PROFILE COMPARISON
                    ┌─────────────────────────┐
                    │ Legend:                 │
                    │ ──── Agent Alpha (67%)  │
                    │ ─ ─ ─ Agent Beta (55%)  │
                    │ ····· Reference Range   │
                    └─────────────────────────┘

                          Depression (D)
                                80
                                │
                              / │ \
                            /   │   \
                          /     │     \
        Anxiety (Pt)    /      │      \    Hypochondriasis (Hs)
              65 ──────┼───────┼────────────── 72
                       │      /│\      │
                       │     / │ \     │
                       │    /  │  \    │
                       │   /...│...\   │
                       │  /    │    \  │
                       │ /     │     \ │
      Social Introversion    \ │ /    Hysteria (Hy)
             (Si) 45 ─────────┼──────── 70
                              /│\
                             / │ \
                            /  │  \
                           /   │   \
                          /    │    \
                        /      │      \
        Hypomania (Ma) ────────┼──────── Psychopathic Deviate (Pd)
                 58            │            53
                               │
                          Paranoia (Pa)
                               42

                    MMPI-2 CLINICAL SCALE PERCENTILES
                    (Shaded area represents normal range)

```

The advanced profile visualization includes:

- **Standardized Clinical Scales**: Based on the Minnesota Multiphasic Personality Inventory (MMPI-2), providing scientific validity and standardized measurement
- **Percentile Rankings**: Each measure shows the agent's position relative to normative samples
- **Multi-agent Comparison**: Different line styles enable overlay of multiple agent profiles
- **Normal Range Indicator**: Shaded area shows typical non-clinical ranges
- **Longitudinal Tracking**: Sequential snapshots can be overlaid to visualize personality development
- **Scenario Matching**: Optimal profiles for specific interaction scenarios can be indicated

This visualization serves both technical monitoring purposes and provides insights into the agent's simulated psychological characteristics, creating more nuanced and human-like interactions.

The system also evaluates agents using the popular Myers-Briggs Type Indicator (MBTI) framework, providing a complementary perspective on interaction styles and decision-making preferences:

```text

                      MBTI PERSONALITY ASSESSMENT
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  AGENT: ALPHA                                            TYPE: INFJ         │
│                                                                             │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐    │
│  │  EXTRAVERSION │ │     SENSING   │ │    THINKING   │ │     JUDGING   │    │
│  │       E       │ │       S       │ │       T       │ │       J       │    │
│  │               │ │               │ │               │ │               │    │
│  │      30%      │ │      45%      │ │      35%      │ │      82%      │    │
│  │    [███░░░░░] │ │    [████░░░░] │ │    [███░░░░░] │ │    [████████] │    │
│  │               │ │               │ │               │ │               │    │
│  │       I       │ │       N       │ │       F       │ │       P       │    │
│  │  INTROVERSION │ │   INTUITION   │ │    FEELING    │ │  PERCEIVING   │    │
│  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘    │
│                                                                             │
│  PREFERENCE STRENGTHS:                                                      │
│  • Introversion (I): Strong preference     (70%)                            │
│  • Intuition (N): Moderate preference      (55%)                            │
│  • Feeling (F): Moderate preference        (65%)                            │
│  • Judging (J): Very strong preference     (82%)                            │
│                                                                             │
│  TYPE DESCRIPTION: Insightful, principled advisor with deep empathy and     │
│  organized approach. Tends to be idealistic and systematic in interactions. │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

```

The MBTI assessment offers additional insights:

- **Dimension Balances**: Visualizes the agent's position on the four key MBTI dimensions (E/I, S/N, T/F, J/P)
- **Type Identification**: Assigns the standard four-letter MBTI type based on strongest preferences
- **Preference Strengths**: Quantifies the strength of each preference rather than binary typing
- **Consistency Tracking**: Monitors stability or evolution of type preferences over conversations
- **Interaction Predictions**: Helps predict communication styles and potential compatibility issues between agents
- **Comparative Analysis**: Multiple agent profiles can be viewed side-by-side to analyze team dynamics

Combined with the MMPI-based clinical profile, these psychological frameworks provide a multi-dimensional understanding of agent personalities and create more realistic character development within the PixelTales environment.

### 10.5 Inter-Agent Communication Analysis

The Psychological Evaluation System also analyzes communication patterns between agents, providing insights into relationship dynamics and interaction qualities. This component is critical for understanding how agents influence each other and collectively shape the scene narrative.

```text

                  INTER-AGENT COMMUNICATION ANALYSIS
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│  RELATIONSHIP MAP: CURRENT SCENE                                           │
│                                                                            │
│        ┌──────────┐                                  ┌──────────┐          │
│        │ AGENT A  │                                  │ AGENT B  │          │
│        │  (INFJ)  │◄────────── Trust: 78% ──────────►│  (ESTP)  │          │
│        └──────────┘                                  └──────────┘          │
│              │                                             │               │
│ Empathy: 85% │                                             │ Dominance: 73%│
│              ▼                                             ▼               │
│        ┌──────────┐                                  ┌──────────┐          │
│        │ AGENT C  │◄──── Conflict Potential: 62% ───►│ AGENT D  │          │
│        │  (ENFP)  │                                  │  (ISTJ)  │          │
│        └──────────┘                                  └──────────┘          │
│                                                                            │
│  COMMUNICATION METRICS:                       INTERACTION PATTERNS:        │
│  • Response Latency: 1.2s avg                • Turn Distribution: Balanced │
│  • Conversation Depth: 4.3/5                 • Topic Control: Agent B (47%)│
│  • Emotional Resonance: 72%                  • Mirroring Behavior: High    │
│  • Reciprocity Index: 0.83                   • Conversation Flow: Natural  │
│                                                                            │
│  RELATIONAL DYNAMICS:                        TEMPORAL TRENDS:              │
│  • A→B: Supportive & Curious                 • Growing Trust A↔B           │
│  • B→C: Instructive & Dominant               • Decreasing Empathy C→D      │
│  • C→D: Cautious & Reserved                  • Increasing Engagement B→A   │
│  • D→A: Respectful & Analytical              • Stabilizing Conflict B↔D    │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘

```

Key elements of inter-agent communication analysis include:

- **Relationship Mapping**: Visual representation of agent connections with quantified relationship attributes (trust, empathy, dominance)
- **Communication Metrics**: Quantitative measures of interaction quality including response times, conversation depth, emotional resonance, and reciprocity
- **Interaction Patterns**: Analysis of turn-taking, topic control, linguistic mirroring, and conversation flow
- **Relational Dynamics**: Qualitative assessment of directional relationship qualities between specific agent pairs
- **Temporal Trends**: Changes in relationship dynamics over time, highlighting evolving social connections
- **Conflict Detection**: Identification of potential tensions based on communication patterns and personality conflicts
- **Group Cohesion Analysis**: Overall assessment of scene harmony and collective narrative coherence

The `PsychEvalService` processes this data by:

1. Collecting interaction events through the `EventBus` subscription to `agent.action` events
2. Analyzing sequential message pairs to detect patterns and relational indicators
3. Computing metrics based on timing data, semantic content, and sentiment analysis
4. Correlating communication behaviors with individual agent personality profiles
5. Constructing relationship graphs with weighted, directed edges between agents
6. Publishing relationship updates to subscribed services via the `EventBus`

This inter-agent analysis complements individual psychological profiles to provide a comprehensive understanding of both individual agent characteristics and emergent social dynamics within the scene.

## 11. Agent State Visualization

The Agent State Visualization provides a view into the agent's internal state, including perception, memory, and cognitive cycles.

### 11.1 Purpose and Goals

- Make the agent's inner workings transparent and legible to users
- Allow exploration of the agent's current state as well as historical states
- Provide different levels of detail through expandable/collapsible views
- Enable correlation between state transitions and agent behaviors

### 11.2 State Broadcast System

- `StateBroadcastService` captures and emits agent state snapshots
- Serialized state objects are transmitted via WebSocket
- Differential updates minimize network traffic
- States are associated with conversation utterances and actions
- Historical states are persisted for playback and analysis

### 11.3 Visualization Interface

The agent's state is displayed through an RPG-style character sheet and quest log interface:

```text

╔═══════════ AGENT STATUS SHEET ═══════════════════════════╗
║ ┌──────────┐                                             ║
║ │    🤖     │  NAME: PIXEL AGENT                         ║
║ │  [Agent  │  STATUS: ACTIVE                             ║
║ │  Pixel   │  SYSTEM HEALTH: [█████████░] 90%            ║
║ │   Art]   │  RESPONSE TIME: 1.2s                        ║
║ └──────────┘                                             ║
╠═════════ PERCEPTION STATS ═══════════════════════════════╣
║                                                          ║
║  CURRENT INPUT: "How do I create a new character?"       ║
║  CONTEXT AWARENESS: [███░░] 3/5                          ║
║  ATTENTION FOCUS: [████░] 4/5                            ║
║                                                          ║
║  RECENTLY SENSED:                                        ║
║  ⦿ User Question (5s ago)                                ║
║  ⦿ Neutral Emotion Detected (8s ago)                     ║
║  ⦿ Previous Conversation Context (30s ago)               ║
║                                                          ║
╠═════════ WORKING MEMORY ═════════════════════════════════╣
║                                                          ║
║  EQUIPPED KNOWLEDGE:                                     ║
║  🧠 PRIMARY: [Character Creation Logic]                  ║
║  📚 SECONDARY: [UI Navigation Tutorial]                  ║
║                                                          ║
║  INVENTORY (FACTS):                                      ║
║  ⦿ User is new to system [recently acquired]             ║
║  ⦿ Project is a game [from long-term memory]             ║
║  ⦿ User needs step-by-step guidance                      ║
║                                                          ║
╠═════════ COGNITIVE CYCLES ═══════════════════════════════╣
║                                                          ║
║  ACTIVE QUEST: Generate Helpful Response                 ║
║  QUEST PROGRESS: [████░░░] PHASE 4/7                     ║
║                                                          ║
║  QUEST STEPS:                                            ║
║  ✓ 1. Parse User Input                                   ║
║  ✓ 2. Retrieve Relevant Knowledge                        ║
║  ✓ 3. Determine Response Strategy                        ║
║  → 4. Generate Response [IN PROGRESS]                    ║
║  □ 5. Verify Accuracy                                    ║
║  □ 6. Format Response                                    ║
║  □ 7. Deliver Response                                   ║
║                                                          ║
║  ACTIVE SKILLS: Reasoning Engine, Language Generation    ║
║                                                          ║
╠═════════ MEMORY SYSTEMS ═════════════════════════════════╣
║                                                          ║
║  SHORT-TERM MEMORY: [███░░░░] 3/10 SLOTS USED            ║
║  WORKING MEMORY: [█████░░░░] 5/10 NODES ACTIVE           ║
║  LONG-TERM MEMORY: 27 ENTRIES INDEXED                    ║
║    (2 RECENTLY ACCESSED)                                 ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝

╔═════════ QUEST LOG & HISTORY ════════════════════════════╗
║                                                          ║
║  VIEW STATE: Current (#24)       ⟲ PREVIOUS ⟳ NEXT       ║
║                                                          ║
║  ◈ COMPLETED QUESTS:                                     ║
║  ✓ Explain Project Structure (#23)                       ║
║  ✓ Greet New User (#22)                                  ║
║  ✓ Initialize Agent Systems (#21)                        ║
║                                                          ║
║  ◈ STATE CHANGES FROM #23 → #24:                         ║
║                                                          ║
║  STATS:                                                  ║
║  ⬆️ Context Awareness: 2 → 3                             ║
║  ⬇️ Response Time: 1.5s → 1.2s                           ║
║                                                          ║
║  EQUIPMENT:                                              ║
║  + Added [Character Creation Logic] to Primary Slot      ║
║  - Removed [Project Overview] from Primary Slot          ║
║                                                          ║
║  INVENTORY:                                              ║
║  + Added [User is new to system]                         ║
║  - Consumed [Previous Question Context]                  ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝

```

### 11.4 Historical State Navigation

- Timeline interface for browsing agent state history
- Snapshot comparison to highlight state differences
- Correlation between state transitions and conversation events
- Ability to replay the agent's "thought process" over time

## 12. Learning Notification System

The Learning Notification System visualizes agent knowledge acquisition through gamified in-game notifications, making cognitive development visible and engaging for users.

### 12.1 Purpose and Goals

- Visualize key cognitive development moments in agent learning
- Provide engaging, RPG-style feedback on agent evolution
- Create a sense of progression and growth in agent capabilities
- Make internal state changes visible through game-appropriate UI

### 12.2 Notification Types

**World Discovery Notifications**:
- Facts about environment properties
- Rules and constraints discovered
- Cause-effect relationships learned
- Contextual variables identified

**Social Insight Notifications**:
- Character personality traits
- Relationship dynamics
- Communication preferences
- Social boundaries and norms

**Self-Discovery Notifications**:
- Identity realizations
- Capability assessments
- Role understanding
- Meta-cognition breakthroughs

**Skill Acquisition Notifications**:
- Improved reasoning abilities
- Specialized knowledge domains
- Communication techniques
- Problem-solving approaches

**Conceptual Framework Notifications**:
- Ontological restructuring
- Category formation
- Hierarchical understanding
- Causal models

### 12.3 Implementation Details

The notification system consists of three main components:

1. **Learning Event Detection**:
   - `LearningDetectionService` monitors memory operations
   - Pattern matchers identify significant learning moments
   - Significance thresholds filter minor updates
   - Category classifiers determine notification type

2. **Notification Generation**:
   - `NotificationFormatter` creates human-readable descriptions
   - `XPCalculator` assigns experience points based on significance
   - `CategoryAssigner` determines skill category for XP allocation
   - `NotificationEnhancer` adds visual styling elements

3. **Frontend Rendering**:
   - WebSocket-driven real-time updates
   - Animated overlay system with depth management
   - Themeable notification templates
   - Sound effects matched to notification type
   - Particle effects for particularly significant insights

```text

┌─────────────────────────────────────────────────────────────────────────┐
│                      NOTIFICATION FLOW PIPELINE                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Memory Write → Significance Check → Categorization → Frontend Dispatch │
│       ↓                 ↓                  ↓                 ↓          │
│  [Fact/Concept]    [Threshold]       [Notification       [WebSocket     │
│  [Change Event]    [Evaluation]       Type + XP]         Broadcast]     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

```

### 12.4 Notification Appearance

Notifications are styled to match the game's pixel art aesthetic, with:

- Distinctive iconography for each notification type
- Color-coding by knowledge domain
- Animated entrance and exit effects
- XP indicators with domain icons
- "Stacking" behavior for rapid sequences of related insights

```text

┌─────────────────────────────────────────────┐
│ 🧠 SOCIAL INSIGHT!                 +10 XP 👥 │
│                                             │
│  "Bob appears uncomfortable when            │
│   discussing political topics"              │
│                                             │
│         [DISMISS] [REMEMBER]                │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 💡 SELF-DISCOVERY!                +25 XP 🔍  │
│                                             │
│  "I am a character in an interactive        │
│   narrative with defined abilities"         │
│                                             │
│         [DISMISS] [REMEMBER]                │
└─────────────────────────────────────────────┘

```

### 12.5 Integration Points

- **Memory Services**: Monitors write operations to detect learning events
- **Event Bus**: Subscribes to learning-related events
- **Frontend WebSocket**: Delivers notifications to client
- **Persistence Layer**: Stores notification history for review
- **Psychological Profile**: Updates stats based on learning patterns
- **Agent State Visualization**: Highlights affected knowledge areas

By making cognitive development visible through gamified notifications, the system creates a more engaging experience where users can observe and appreciate the emergent intelligence of agents as they explore, learn, and evolve.
