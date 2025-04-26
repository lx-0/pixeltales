# 2. Core Subsystems

## 2.1 The `Agent`: Core Autonomous Entity

Each character participating in a scene is represented by an instance of the `Agent` (likely implemented as a NestJS service instance or managed class). The `Agent` is the primary locus of state, perception, cognition, and action.

The following diagram illustrates the flow of information and decision-making within a single agent, drawing parallels to human cognitive processes:

```diagram/text
+------------------------------------------------------------------------------------------------------------------------------------------+
|                                         🧠 AGENT'S MIND (ENTIRE COGNITIVE ARCHITECTURE)                                                  |
+------------------------------------------------------------------------------------------------------------------------------------------+
|                                                                                                                                          |
|       Environmental Events (Perceived via Vision/Audio/Other Sensors)                                                                    │
|                          +---------------------------------------------------------------------------------------------------------------┼---+
|                          v                                                                                                               |   |    Agent Actions
| +--------------------------+         +-----------------------------+         +--------------------------+  +---------------------------+ |   |    (Executed via
| | 👁️ Perception System (2.2)|--------►| 🔄 Cognitive Cycle (2.3)    |--------►| 🎯 Action System (2.5)   |--| 🛠️ Capability Extensions  |─┼-------+  Speech/Motion...)
| |   (Filtering Senses)     |         |    (Thinking & Deciding)    |         |   (Formatting Decisions) |  |   (2.6)                   | |   |   v
| |                          |         |                             |         |                          |  |                           | |  +--------------------------+
| | • Vision Processing      |         | ┌─────────────────────────┐ |         | • Format Action Intent   |  | • Speech Output           | |  | 🌍 Environment Simulation|
| | • Audio Processing       |         | │ ⚡ System-1 (Fast, 2.1.3)│ |         | • Select Capability Ext. |  | • Motion Control          | |  |    Layer (2.12)          |
| | • Event Filtering        |         | │ • Immediate Reactions   │ |         | • Track Action Results   |  | • Object Interaction      | |  +--------------------------+
| | • Context Building       |         | └─────────────────────────┘ |         | • Emit Internal Events   |  | • Environment Query       | |
| +-----------+--------------+         |                             |         +------------+-------------+  | • ...                     | |
|             │                        | ┌─────────────────────────┐ |                      ▲                +---------------------------+ |
|             │                        | │ 🔍 System-2 (Slow, 2.1.3)│ |                     │                                              |
|             ▼                        | │ • Deliberative Reasoning│ |◄───────┬─────────────┘                                              |
| +--------------------------+         | └─────────────────────────┘ |        │ ┌─────────────────────────────────┐                        |
| | 💡 Curiosity System (2.9)|◄───────►|                             |        │ │ 🧰 Internal Interface Tools:     |                        |
| |   (Intrinsic Motivation) |         | ┌─────────────────────────┐ |        └─┤   (2.7)                         │                        |
| |                          |         | │ 📝 Planner/Executor     │ |          │                                 │                        |
| | • Information Seeking    |         | │   (2.1.4)               │ |          │ • Memory Access                 │                        |
| | • Uncertainty Tracking   |         | │ • HTN Planning & Exec.  │ |          │ • DateTime                      │                        |
| | • Hypothesis Generation  |         | └─────────────────────────┘ |          │ • Ontology Query                │                        |
| | • Experimentation Goals  |         |                             |          │ • Self-Model Query              │                        |
| +-----------+--------------+         | 1. Observe (Gather Context) |          │ • Conversation Control          │                        |
|             │                        | 2. Orient (Contextualize)   |          │ • ...                           │                        |
|             │                        | 3. Decide/Plan (Select Goal)|          └─────────────────────────────────┘                        |
|             │                        | 4. Act (Initiate Execution) |                                                                     |
|             │                        +-------------+------▲--------+                                                                     |
|             │                                      │      │                                                                              |
|             │                                      ▼      │                                                                              |
|             ▼                             +------------------------------------------------------------------+                           |
| +--------------------------+              | 🧬 Internal State & Memory System (2.4)                          |                           |
| | 📚 Ontology System (2.10)|◄─────────────►    (Mind's Storage)                                              |                           |
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
|             │                             +------------------------------+        +-------------------------+                            |
|             └─────────────────────────────► 👤 Self-Modeling System (2.11)|◄─────►| 📈 Learning System (2.8) |                            |
|                                           |   (Understanding Self)       |        | (Experience Adaptation) |                            |
|                                           |                              |        |                         |                            |
|                                           | • Capability Assessment      |        | • Policy Updates        |                            |
|                                           | • Agency & Boundaries        |        | • Meta-Learning         |                            |
|                                           | • Role vs. System            |        | • Reward Signal Proc.   |                            |
|                                           | • Mental State Awareness     |        | • Behavioral Adaptation |                            |
|                                           +------------------------------+        +-------------------------+                            |
|                                                      ▲                                 ▲                                                 |
|                                                      │                                 │                                                 |
|                                                      └───────────┐       ┌─────────────┘                                                 |
|                                                                  │       │                                                               |
|                                                                  ▼       ▼                                                               |
|                                                         +--------------------+                                                           |
|                                                         | ⚡ Integration Layer|                                                           |
|                                                         |   (4.1)            |                                                           |
|                                                         +--------+-----------+                                                           |
|                                                                  │                                                                       |
|                                                                  │                                                                       |
|                                                                  ▼                                                                       |
|                                                         +--------------------+                                                           |
|                                                         | 📡 Event Bus (3.1) |                                                           |
|                                                         |   (Communication)  |                                                           |
|                                                         +--------+-----------+                                                           |
+------------------------------------------------------------------------------------------------------------------------------------------+
                                                                     │
                                                       +-------------+-------------+
                                                       |                           |
                                                       ▼                           ▼
                                             +---------------------+      +----------------------+
                                             | 📊 Analytics Systems|      | 🍿 Notification System|
                                             |     (Ch. 3)         |      |       (3.6)          |
                                             +---------------------+      +----------------------+
                                               |               |
                                               ▼               ▼
                                    +----------------------+  +----------------------+
                                    | 🕵️ Psychological Eval|  | 💬 Communication      |
                                    |       (3.3)          |  |   Analysis (3.4)     |
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
│                        │ Trigger Reflection Cycle                     │
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
│      │       +------------------------------------------+        │    │
│      │       │                ▲ Reads Memory            │        │    │
│      │       ▼                │ Delegates Updates       │        │    │
│ ┌────── Ontology System ────┐ │ ┌──────── Reflection System ───┐ │    │
│ │   Structured Knowledge    │ │ │     (Synthesizing Exp.)      │ │    │
│ │                           │◄──+                              ├─┘    │
│ │ • Conceptual Hierarchies  │ │ │ • Generates Insights         │      │
│ │ • Relation Networks       │ │ │ • Triggers Self/World Updates│      │
│ │ • Knowledge Integration   │ │ └──────────────────────────────┘      │
│ └─────▲─────────────────────┘ │     ┌──────── Curiosity System ─────┐ │
│       │ Updates Ontology      │     │     Intrinsic Motivation      │ │
│       └───────────────────────+─────┤                               │ │
│                                     │ • Information Gap Detection   │ │
│                                     │ • Hypothesis Generation       │ │
│                                     │ • Experimental Design         │ │
│                                     └───────────────────────────────┘ │
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
   - The Curiosity System detects knowledge gaps and creates hypotheses
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

Mimicking sensory input, the Perception System is how the agent receives information about the
external world (the scene and other agents).

This system acts as the agent's interface to the external world, processing raw sensory information from the environment simulation into meaningful, structured events that the agent's cognitive processes can understand.

 **Purpose & Design:**

- **Sense the Environment:** Receives simulated sensory data (visual, auditory, etc.) corresponding to events and states in the shared environment.
- **Translate Raw Data:** Converts low-level sensory input into higher-level, typed `AgentPerceptionEvent`s using dedicated Perception Extensions.
- **Filter & Prioritize:** Selects relevant events based on factors like proximity, agent's current focus, visibility, and pre-defined filters. Assigns importance levels.
- **Assess Salience:** Evaluates the significance of perceptions based on novelty, emotional impact, and relevance to current goals or interests.
- **Build Initial Context:** Begins the process of integrating new information with the agent's existing internal state.
- **Maintain Anonymity:** Ensures the agent perceives others only through temporary identifiers (`visualId`) linked to appearance, not internal IDs.

**Input:**

- Receives simulated sensory data (visual, auditory, etc.) from the Environment Simulation Layer via Perception Extensions.
- Input data is translated into typed `AgentPerceptionEvent`s. Example Event Types:
    - `MessageBroadcastEvent`: `{ type: 'message', visualId: string, content: string, timestamp: number }`
    - `AgentEnteredEvent`: `{ type: 'enter', visualId: string, visualDescription: string, timestamp: number }`
    - `AgentLeftEvent`: `{ type: 'leave', visualId: string, timestamp: number }`
    - `SceneUpdateEvent`: `{ type: 'scene_update', description: string, timestamp: number }`
- **Anonymity:** Crucially, the agent only perceives temporary `visualId`s associated with other agents' appearances, not their internal `agentId` or private state. Knowledge about others must be inferred.

**Processing:**

- **Translate Raw Data:** Perception Extensions convert raw data to `AgentPerceptionEvent`s.
- **Event Filtering**: Discards irrelevant events based on proximity, visibility, focus, etc.
- **Priority Determination**: Assigns importance levels to incoming perceptions.
- **Salience Calculation**: Evaluates novelty, emotional impact, goal relevance (potentially uses lightweight LLM).
- **Context Building**: Integrates new perceptions with existing mental context (initial step).
- **Attention Direction**: Focuses cognitive resources on high-value information.
- **Processing Type:** Mixed. Translation/filtering is Data Processing. Salience/interpretation might involve Lightweight LLM Calls (synchronous in Observe phase).

**Core Components:**

- **Perception Extensions (See Section 2.6):** Specific modules responsible for processing different sensory modalities:
    - `VisualPerceptionExtension`: Processes visual data → events.
    - `AuditoryPerceptionExtension`: Processes audio data (e.g., simulated speech) → events.
    - *(Potentially others)*
- `PerceptionService` (Conceptual/Implicit): Represents the overall logic managing the flow from extensions to the Cognitive Cycle, including filtering and salience assessment. This might be part of the Cognitive Cycle's "Observe" phase rather than a separate dedicated service instance.
- Schemas (`packages/contracts`):
    - `AgentPerceptionEventSchema` (and its specific event subtypes): Defines the structured output fed to the Cognitive Cycle.
- Key Logic:
    - Event Filtering Rules.
    - Salience Calculation Heuristics.
    - Priority Assignment logic.

**Knowledge Representation:**

- Focuses on the structure of `AgentPerceptionEvent` subtypes.
- May utilize internal state (`AgentDynamicState`) to inform filtering/salience.

**Core Functions:**

- **Receive Sensory Data:** Accepts input streams via Perception Extensions.
- **Translate Events:** Converts raw data into `AgentPerceptionEvent` types.
- **Filter:** Discards irrelevant/low-priority information.
- **Prioritize/Assess Salience:** Determines importance and relevance.
- **Forward to Cognition:** Passes filtered, typed events to the Cognitive Cycle.

**Key Differentiators:**

- **Focus:** Translating *external* phenomena into *internal*, structured representations.
- **Input:** Raw or semi-processed sensory data.
- **Output:** Typed `AgentPerceptionEvent`s.

**Primary Integration Flow:**

```diagram/text
+-------------------------+   Raw Sensory Data   +--------------------------+
| Environment Simulation  |--------------------->| Perception Extensions    |
| Layer (2.12)            | (Visual, Audio...)   | (VisualPerception, etc.) |
|                         |                      |         (2.6)            |
+-------------------------+                      +-----------+--------------+
                                                             | Translated Events
                                                             ▼
                                                 +-----------+------------+
                                                 | Perception Logic       |
                                                 | (Filtering, Salience)  |
                                                 | (Part of 2.2 / 2.3)    |
                                                 +-----------+------------+
                                                             | Filtered, Typed
                                                             | AgentPerceptionEvents
                                                             ▼
+-------------------------+                      +-----------+------------+
| Cognitive Cycle (2.3)   |<---------------------| Event Bus (Optional?)  |
| (Observe Phase Receives)|                      | or Direct Call         |
+-------------------------+                      +------------------------+
```

*(Note: The direct flow might be Perception Extensions -> Cognitive Cycle directly, or via the Event Bus)*

**Integration Points (Details):**

- **← Environment Simulation Layer (2.12) / Perception Extensions (2.6):** Receives raw or processed sensory data.
- **→ Cognitive Cycle (2.3):** Provides the filtered and typed `AgentPerceptionEvent` stream as the primary input for the agent's reasoning loop (Observe phase).
- **← Environment Simulation Layer (2.12) / Perception Extensions (2.6):** Receives raw or processed sensory data.
- **→ Cognitive Cycle (2.3):** Provides the filtered and typed `AgentPerceptionEvent` stream as the primary input for the agent's reasoning loop (Observe phase).
- **→ Memory System (2.4):** High-priority or salient perceptions might be directly logged to Episodic Memory by the Cognitive Cycle after initial processing.
- **→ Curiosity System (2.9.2):** Flags novel, surprising, or unexpected perceptions identified during salience assessment, potentially triggering curiosity-driven goals.
- **↔ Self-Modeling System (2.11) / AgentDynamicState (2.4.1):** Filtering and salience logic may consult the agent's current state (e.g., `currentFocus`, `interestLevel`, known capabilities) to determine relevance.

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

Given the significant timing differences between data processing and LLM-dependent subsystems, the `CognitiveCycleService` (managing the Cognitive Cycle) employs specific strategies to handle asynchronous operations without blocking the agent's responsiveness:

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

The `CognitiveCycleService`, in conjunction with the `MemoryService` and potentially specialized context management utilities, is responsible for applying these strategies dynamically based on the required cognitive task (e.g., quick reaction vs. deep reflection vs. planning).

### 2.3.6 Agent Loop Strategy (Hybrid Approach)

To balance responsiveness with background processing needs (like reflection or periodic checks), a hybrid loop strategy is employed:

1. **Event-Driven Reactivity:**
    - The `AgentService` subscribes to perception events (e.g., via the Event Bus or directly from a Simulation/Routing service).
    - When a perception arrives for a specific agent, it is added to the agent's internal `perceptionBuffer`.
    - A processing function (`_tryProcessAgentPerceptions`) is immediately triggered.
    - This function attempts to acquire a processing lock (`isProcessing` flag) for the agent.
    - If successful, it sequentially processes *all* perceptions currently in the buffer by calling `CognitiveCycleService.processPerceptionEvent` for each one, applying state updates after each cycle.
    - This ensures immediate reaction to incoming stimuli.

2. **Periodic Background Tick:**
    - A low-frequency `setInterval` (e.g., 15-30 seconds) runs for each active agent (`startAgentBackgroundLoop`).
    - On each tick, it checks if the agent has been idle beyond a threshold (`IDLE_THRESHOLD_MS`).
    - If idle and not currently processing, it can trigger background tasks like reflection (`reflectionService.performReflection`) asynchronously.
    - It *also* calls `_tryProcessAgentPerceptions` as a fallback mechanism to ensure any buffered perceptions are eventually processed, even if the primary event trigger failed.

This hybrid model allows agents to react quickly to events while providing opportunities for slower, non-critical background tasks like reflection and periodic checks.

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
- Serves as the "mental workbench" where immediate reasoning occurs

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

The agent interacts with the world by producing a typed `AgentAction` object at the end of its Cognitive Cycle. **This action represents the agent's *intent*.** This system acts as the bridge between the agent's internal decision-making and its external manifestation via capabilities.

**Purpose & Design:**

- **Translate Intent:** Converts the high-level decision or plan step from the Cognitive Cycle into a standardized, executable format.
- **Format Action:** Structures the action details according to the specific `AgentActionSchema` subtype (speak, move, interact, etc.).
- **Dispatch to Capability:** Selects the appropriate `Capability Extension` based on the `AgentAction` type and sends the formatted payload for execution.
- **Ensure Clarity:** Guarantees the agent's intended action is unambiguous for execution, logging, and analysis.

**Input:**

- The final decision or next actionable step determined by the Cognitive Cycle's Decide/Plan phase. This could be a direct response (System-1) or a `PlanNode` to execute (System-2/Planner).

**Processing:**

- **Formatting:** Maps the input decision/plan node to the corresponding `AgentActionSchema` subtype and populates its payload.
- **Validation:** Ensures the action payload conforms to the schema.
- **Routing/Dispatch:** Identifies the correct `Capability Extension` (e.g., `SpeechOutputExtension` for 'speak', `MotionControlExtension` for 'move') and invokes its execution method with the action payload.
- **Event Emission:** Emits an event (e.g., `agent.action.intent`) via the Event Bus signifying the action the agent *intends* to take, *before* execution confirmation.
- **Processing Type:** Primarily **Data Processing**. Involves mapping, formatting, validation, and simple routing logic. No significant computation or LLM calls are expected within the Action System itself.

**Core Components:**

- `ActionService`: Implements the `IActionService`; contains the logic for formatting and dispatching actions.
- `IActionService`: Defines the contract for the Action System.
- Schemas (`packages/contracts`):
    - `AgentActionSchema`: The core discriminated union defining all possible action types:
    - `speak`: Contains the detailed `CharacterResponseSchema` payload (content, tone, target audience if applicable).
    - `move`: Specifies target coordinates, object, or path.
    - `interact`: Specifies target object and interaction type.
    - `use_internal_tool`: Specifies the internal interface tool and input (e.g., memory query).
    - `update_state`: Represents an internal decision to change mood, focus, etc.
    - `no_action`: Explicitly indicates the agent chose not to act, potentially with a reason.
    - `experiment`: Indicates the agent is testing a hypothesis about the world.
    - Specific payload schemas for each action type (e.g., `CharacterResponseSchema` for `speak`).

**Knowledge Representation:**

- Primarily concerned with the definition and structure of the `AgentActionSchema` and its subtypes.

**Core Functions:**

- **Format Intent:** Translates internal decisions into structured `AgentAction` objects.
- **Select Capability:** Determines the correct extension to handle the action type.
- **Dispatch Action:** Invokes the relevant `Capability Extension`'s execution method.

**Key Differentiators:**

- **Focus:** Formatting and dispatching *intended* actions. Distinct from the `Cognitive Cycle` which *decides* the intent, and the `Capability Extensions` which physically *execute* the action in the environment simulation.
- **Timing:** Operates at the very end of the Cognitive Cycle's "Act" phase, just before interaction with the external world simulation.

**Primary Integration Flow:**

```diagram/text
+-----------------------+      Decision/Intent      +-----------------------+
| Cognitive Cycle (2.3) |-------------------------->|    Action Service     |
| (Decide/Plan Phase)   |                           |        (2.5)          |
+-----------------------+                           +-----------+-----------+
                                                                | Formatted AgentAction
                                                                | Dispatch
                                                                ▼
                                                    +-----------+------------+
                                                    | Capability Extension   |
                                                    | (Speech, Motion, etc.) |
                                                    |        (2.6)           |
                                                    +-----------+------------+
                                                                | Execute in Environment
                                                                ▼
                                                    +-------------------------+
                                                    | Environment Simulation  |
                                                    | Layer (2.12)            |
                                                    +-------------------------+
```

**Integration Points (Details):**

- **← Cognitive Cycle (2.3):** Receives the final decision/intent to be acted upon.
- **→ Capability Extensions (2.6):** Sends the formatted `AgentAction` payload to the appropriate extension for execution in the simulation layer.
- **→ Event Bus (3.1):** Emits action *intent* events (e.g., `agent.action.speak.intent`) for monitoring and potentially for the Learning System to correlate with eventual outcomes.
- **→ Learning System (2.8):** Provides the `AgentAction` component of the experience tuple `(state, action, reward)`. The *outcome* of the action is perceived later via the Perception system.
- **→ Statistics (3.2):** Contributes metrics based on the *intended* action type and payload, allowing analysis of agent decisions separate from execution success.

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

This system enables agents to **adapt their behavior and decision-making strategies** over time based on accumulated experience, feedback signals, and intrinsic motivations. Its primary goal is to improve future performance towards the agent's objectives.

**Purpose & Design:**

- **Adapt Behavior:** Modifies the agent's internal policies, heuristics, or parameters used during the Cognitive Cycle to achieve better outcomes.
- **Experience-Driven:** Learns from sequences of states, actions, and resulting rewards recorded during interactions.
- **Reward-Centric:** Utilizes a `RewardFunction` to quantify the desirability of outcomes based on goal progress, interaction quality, feedback, and potentially intrinsic signals like information gain (from Curiosity).
- **Incremental Improvement:** Typically operates through periodic updates (online or offline) rather than altering behavior drastically in a single step.

**Core Components:**

- `LearningService`: Implements the `ILearningInterface`; orchestrates reward recording and policy updates.
- `ILearningInterface`: Defines the contract for interacting with the Learning System (e.g., `recordReward`, `getExperienceBatch`, `updatePolicy`).
- `RewardFunction`: Encapsulates the logic for calculating scalar reward values based on `RewardFunctionInput`.
- `IRewardFunction`: Interface for the reward function.

*Knowledge Representation:*
- `RewardFunctionInputSchema`: Zod schema defining inputs for reward calculation.
- `Experience Storage`: Implicit reliance on the `MemoryService` (Episodic Memory) to store and retrieve experience tuples (state, action, reward, next_state).

- Event Types: `learning.reward.recorded`, `learning.policy.updated`.

**Core Functions:**

- **Adapt Behavior:** Modifies the agent's internal policies, heuristics, or parameters used during the Cognitive Cycle to achieve better outcomes.
- **Process Rewards:** Records and utilizes reward signals based on `RewardFunctionInput`.
- **Update Policies:** Applies learning algorithms (e.g., RL, fine-tuning) to refine decision-making strategies based on stored experiences.

**Key Differentiators:**

- **Focus:** Behavioral adaptation and policy optimization, not insight synthesis (`ReflectionService`) or explicit knowledge modeling (`OntologyService`, `SelfModelingService`). Aims to improve *how* the agent decides/acts.
- **Mechanism:** Primarily driven by reward signals and experience replay, often using reinforcement learning or related techniques.
- **Output:** Updated decision-making parameters, planning heuristics, or internal policies affecting the Cognitive Cycle. Examples include **adjusting HTN planner weights, reprioritizing goals, adapting `personalityCore` embeddings, or updating heuristics stored as facts in Semantic Memory.**

**Processing Type:**

- **Mixed.** Reward recording is data processing. Policy updates can range from data processing (e.g., updating Q-values) to **significant computation or LLM calls** (e.g., fine-tuning embeddings, using LLMs to analyze experiences and suggest heuristic changes). Policy updates typically run **asynchronously** or periodically.
- **Includes MetaLearning:** Background processes may also run periodically to support learning efficiency, such as **compressing memory traces, pruning low-signal data, and updating semantic vector stores.**

**Primary Integration Flow:**

```diagram/text
+-----------------------+  Record Experience +-----------------------+
| Cognitive Cycle (2.3) |------------------->|   Learning Service    |
| (Provides State,      | (state, action,    |        (2.8)          |
|  Action, Outcome)     |  reward)           +-----------+-----------+
+-----------------------+                                | ▲
                              Record Reward Event /      | │ Retrieve Experiences
                                Policy Update Event      │ │   for Training
                                                         ▼ │
                                               +-----------+-----------+
                                               | Event Bus / Statistics|
                                               | (3.1, 3.2)            |
                                               +-----------------------+
                                                         ▲ │
                            Get Reward Input / Store Exp.│ │ Get Experiences
                                                         │ ▼
                                               +-----------+-----------+
                                               |  Memory Service (2.4) |
                                               | (Episodic/Semantic)   |
                                               +-----------+-----------+
                                                         │ ▲
                          Update Learned Policies/Params │ │ Read Agent Config/State
                                                         │ │ (For applying updates)
                                                         │ ▼
                                               +-----------------------+
                                               | Agent State/Config    |
                                               | (Implicitly updated)  |
                                               +-----------------------+
```

**Integration Points (Details):**

- **← Cognitive Cycle (2.3):** Receives experience tuples (state snapshot, action taken, reward score) via `recordReward`. Provides the context for reward calculation. Is influenced by updated policies/heuristics during its Decide/Plan phase.
- **↔ Memory System (2.4):** Stores experiences (state, action, reward) likely in Episodic Memory; Retrieves batches of experiences for policy updates; May update Semantic Memory with learned rules or heuristics.
- **← RewardFunction:** Provides the scalar reward signal used in `recordReward`.
- **→ Event Bus (3.1):** Emits events like `learning.reward.recorded` and `learning.policy.updated`.
- **→ Statistics (3.2):** Provides metrics on reward distribution, learning frequency, policy changes.
- **→ Agent State/Config:** Updates internal parameters, policies, or potentially configuration aspects (like personality embeddings if adaptable) that influence future Cognitive Cycles.
- **(Indirectly) ← Curiosity System (2.9.2):** May receive information gain metrics contributing to the reward signal.
- **(Indirectly) ← Reflection System (2.9.1):** May be influenced by insights generated during reflection if those insights lead to changes in goals or context that affect rewards.

## 2.9 Synthesizing & Driving Systems

### 2.9.1 Reflection System: Synthesizing Experience

While the Learning System focuses on adapting future behavior based on rewards, and Self-Modeling/Ontology focus on updating specific knowledge models, the Reflection System acts as a higher-level **orchestrator for synthesizing insights** across domains from past experiences.

**Purpose & Design:**

- **Orchestrate Reflection:** Triggered periodically or contextually (e.g., during idle time) by the Cognitive Cycle.
- **Synthesize Experience:** Fetches recent observations and actions from the Memory System (Episodic Memory).
- **Generate Insights:** Potentially utilizes LLM capabilities (distinct from System-1/System-2 core cycle calls) to perform a broader analysis, identifying patterns, causal links, or significant learnings across domains (self, world, social, goals).
- **Produce Report:** Generates a structured `ReflectionReport` (using `ReflectionReportSchema`) summarizing the insights, confidence levels, and supporting evidence.
- **Delegate Updates:** Based on the generated insights, it triggers updates in other systems:
    - Calls `SelfModelingService` to refine the self-concept.
    - Calls `OntologyService` to update world knowledge or relations.
    - May emit events or provide data influencing the `LearningService` (e.g., highlighting high-impact experiences).

**Core Components:**

- `ReflectionService`: Implements the orchestration logic.

*Knowledge Representation:*
- `ReflectionReportSchema`: Defines the structure of the reflection output.

**Key Differentiators:**

- **Focus:** Synthesis and insight generation, not direct behavioral adaptation (`LearningService`) or specific knowledge updates (`SelfModeling`/`Ontology`).
- **Trigger:** Explicit reflection cycles, distinct from the main perception-action loop.
- **Output:** A comprehensive report potentially leading to updates across multiple knowledge domains.
- **Primary Input:** Primarily recent episodic memory entries (observations, past actions) rather than immediate environmental perception.
- **Processing:** Can involve significant computation, potentially including **LLM calls** for insight generation, but typically operates **asynchronously** or during low-priority periods, distinct from the real-time System-1/System-2 LLM calls.

**Primary Integration Flow:**

```diagram/text
+-----------------------+       Trigger        +-----------------------+
| Cognitive Cycle (2.3) |--------------------->| Reflection Service    |
| (e.g., Idle Trigger)  |                      |    (Orchestrator)     |
+-----------------------+                      +-----------+-----------+
                                                           |  ▲
                               Request Recent Experiences /|  │ Generate Insights
                                 Store Reflection Report   |  │ (LLM Call)
                                                           ▼  │
                                                 +-----------+-----------+
                                                 | Memory Service (2.4)  |
                                                 | (Episodic/Semantic)   |
                                                 +-----------+-----------+
                                                             |
                                                             │ Calls to Update Modules
                                                             │ based on Insights
                            +--------------------------------+---------------------------------+
                            |                                |                                 |
                            ▼ Apply Self-Insights            ▼ Apply World-Insights            ▼ Emit Report Summary
+-----------------------------+           +--------------------------+           +-------------------+
| SelfModeling Service (2.11) |           | Ontology Service (2.10)  |           | Event Bus (3.1)   |
| (Applies Self-Updates)      |           | (Applies World Updates)  |           | (Receives Report) |
+-----------------------------+           +--------------------------+           +-------------------+
```

**Integration Points (Details):**

- **← Cognitive Cycle (2.3):** Receives triggers to initiate reflection.
- **→ Memory System (2.4):** Reads recent episodic data for analysis; Writes the final `ReflectionReport`.
- **→ Self-Modeling System (2.11):** Triggers updates to the self-model based on insights.
- **→ Ontology System (2.10):** Triggers updates to world knowledge based on insights.
- **→ Learning System (2.8):** Potentially provides summarized experiences or highlights impactful events (indirect influence).
- **→ Event Bus (3.1):** Emits events like `reflection.completed` with the report summary.
- **→ Statistics (3.2):** Provides metrics on reflection frequency, duration, and insight types.

This dedicated system ensures that higher-order learning and synthesis are handled distinctly from the immediate cognitive cycle, allowing for deeper understanding to emerge over time without blocking real-time responsiveness.

### 2.9.2 Curiosity & Discovery System

This system provides the agent with **intrinsic motivation** to explore its environment, seek information, resolve uncertainties, and test its understanding of the world and itself. It drives learning beyond explicit rewards by encouraging exploration and hypothesis testing. This system serves a unique dual role, bridging **knowledge acquisition** (connecting to Memory/Ontology) and **agent development** (driving learning).

**Purpose & Design:**

- **Drive Exploration:** Generates goals aimed at reducing uncertainty or testing hypotheses.
- **Identify Knowledge Gaps:** Monitors the agent's internal state (memory, ontology, self-model) to detect areas of low confidence or missing information.
- **Generate Hypotheses:** Creates plausible explanations for novel or surprising observations.
- **Design & Track Experiments:** Formulates actions (experiments) to test hypotheses and records the outcomes.
- **Quantify Information Gain:** Assesses the value of potential exploratory actions based on expected knowledge gain or uncertainty reduction.

**Core Components:**

- `CuriosityService`: The central orchestrator managing intrinsic motivation, uncertainty, hypotheses, and experiments. Key methods include:
    - `trackUncertainty(domain, confidence)`: Monitors areas of certainty.
    - `generateHypotheses(observation)`: Creates plausible explanations for observations.
    - `prioritizeExplorations()`: Ranks information-seeking goals.
    - `recordExperimentResult(experimentId, result)`: Updates beliefs based on tests.

*Knowledge Representation:*
- Schemas (`packages/contracts`):
    - `HypothesisSchema`: Structure for testable hypotheses (defines **hypothesis lifecycle:** generation → testing → confirmation/rejection → belief updating).
    - `ExperimentSchema`: Defines planned actions to test a hypothesis.
    - `ExperimentResultSchema`: Records the outcome of an experiment and confidence updates.

- Internal Logic / Information Value Assessment: Includes functions for:
    - `calculateInformationGain(state, action, prediction)`: Bayesian estimation of knowledge value.
    - `uncertaintyReduction(domain, before, after)`: Measures learning progress.
    - `surpriseDetection(expected, observed)`: Identifies prediction errors worth investigating.
- Event Types: Potentially `curiosity.hypothesis.generated`, `curiosity.experiment.started`, `curiosity.experiment.completed`, `curiosity.surprise.detected`.

**Key Differentiators:**

- **Focus:** Intrinsic motivation, exploration, hypothesis testing, and resolving uncertainty. Not focused on synthesizing past broad experiences (`ReflectionService`) or direct behavioral adaptation based on external reward (`LearningService`).
- **Driver:** Operates based on novelty, prediction error (surprise), and internal uncertainty metrics, rather than explicit goals or external feedback alone.
- **Output:** Generates exploratory goals for the Cognitive Cycle, hypotheses for Memory/Ontology, and potentially intrinsic reward signals (information gain) for the Learning System.

**Processing Type:**

- **Mixed / LLM-Dependent.** Uncertainty tracking is data processing. Surprise detection might be rule-based or require simple LLM checks. **Hypothesis generation and experiment design are often complex creative tasks heavily reliant on LLM calls.** These LLM calls might run asynchronously or be interleaved within the Cognitive Cycle's slower System-2 path when triggered.

**Primary Integration Flow:**

```diagram/text
+------------------------+       +------------------------+       +------------------------+
| Memory/Ontology/Self   |------>|   Curiosity Service    |<------| Cognitive Cycle (2.3)  |
| (2.4, 2.10, 2.11)      | Read  |        (2.9.2)         | Signal| (Observe/Orient)       |
|                        |<------| (Updates Beliefs)      |------>|                        |
| Store Hypo/Results     | Update|                        | Goal  +--------+---------------+
+-----------+------------+ Beliefs+----------+------------+                |
            ^                                ▲  │                          |
            │                                │  │ Hypothesize/Plan         |
            │ Update Knowledge               │  │ (LLM Call?)              |
            │                                │  │                          |
            +--------------------------------+  ▼                          |
                                                                           |
                               Execute Experiment Plan                     |
                                                                           ▼
                                                 +-----------+---------------+
                                                 | Action System / Planner   |
                                                 |   (2.5 / 2.1.4)           |
                                                 +-----------+---------------+
                                                             | Execute Action
                                                             ▼
                                                 +-----------+-----------------+
                                                 | Capability Extensions (2.6) |
                                                 +-----------+-----------------+
                                                             | Action in Environment
                                                             ▼
                                                 +---------------------------+
                                                 | Environment / Perception  |
                                                 | (Results Observed)        |
                                                 +-----------+---------------+
                                                             | Perceive Outcome
                                                             ▼
                                                 +-----------+---------------+
                                                 | Cognitive Cycle (2.3)     |
                                                 | (Perceives Outcome)       |
                                                 +-----------+-----┬---------+
                                                             │     │
                                        Result & Info Gain   │     │ Provide Info Gain
                                     (To Curiosity Service)  │     │ (To Learning Service)
                                                             ▼     ▼
                                                 +-----------+--+----------+
                                                 | Learning Service (2.8)  |
                                                 | (Uses Info Gain)        |
                                                 +-------------------------+
```

**Integration Points (Details):**

*Direct Integrations:*

- **↔ Cognitive Cycle (2.3):** Receives surprising/novel observations during Observe/Orient; Gets triggered by uncertainty signals; Provides exploratory goals or experiment plans to the Decide/Plan phase.
    - **System-1/System-2 Interaction:** Detects cognitive "surprises" (via `surpriseDetection`) that can trigger **System-2** activation; Provides experimental goals that drive deliberative planning via **System-2**; Can support quick intuitive **System-1** reactions to novel stimuli via surprise signals.
- **↔ Memory System (2.4):** Reads observations/facts/concepts to detect surprise, identify knowledge gaps, and generate hypotheses; Stores/Retrieves hypotheses (`HypothesisSchema`), experiment designs (`ExperimentSchema`), and results (`ExperimentResultSchema`); Stores/Retrieves uncertainty levels associated with facts/concepts.
- **→ Action System (2.5) / Planner (2.1.4):** Receives experiment plans for execution.
- **→ Capability Extensions (2.6):** Executes the specific actions defined in an experiment plan.
- **→ Ontology System (2.10):** Provides confirmed findings from experiments to update world knowledge. (Internally, Curiosity *consults* ontology via memory/tools when generating hypotheses).
- **→ Self-Modeling System (2.11):** Provides results from capability-testing experiments to update and refine the self-model. (Internally, Curiosity *consults* the self-model via memory/tools when generating hypotheses).
- **→ Learning System (2.8):** Provides information gain/uncertainty reduction metrics (calculated via internal logic like `calculateInformationGain`) that can be factored into the reward signal calculation. This intrinsic reward signal **drives agent adaptation through exploration** and can help **guide meta-learning** about valuable knowledge areas.
- **→ Event Bus (3.1):** Emits events related to hypothesis status, experiment progress, surprise detection (e.g., `curiosity.discovery.xyz` which might trigger the external **Notification System (3.6)**).
- **→ Statistics (3.2):** Provides metrics on exploration frequency, hypothesis success rates, information gain achieved.

*Indirect Integrations:*

- **→ Perception System (2.2):** Curiosity-driven exploratory actions generate new environmental events that are subsequently processed by the Perception System of this agent and potentially others.
- **→ Internal Interface Tools (2.7):** Goals generated by Curiosity might necessitate the use of various tools by the Cognitive Cycle/Planner during the execution of an experiment.

## 2.10 Ontological Reasoning System

This system provides the agent with a structured understanding of the world by organizing knowledge into hierarchical concepts, explicit relations, and properties. It acts as the manager and reasoning engine for the agent's explicit World Model, primarily leveraging and structuring data stored within the Semantic Memory subsystem.

**Purpose & Design:**

- **Structure Knowledge:** Organizes factual information (from Semantic Memory) into a network of concepts and relationships (e.g., is-a, has-a, part-of).
- **Enable Sophisticated Reasoning:** Supports inference beyond simple fact retrieval, such as property inheritance, consistency checking, analogical mapping, and potentially counterfactual reasoning.
- **Contextualize Information:** Helps the agent interpret new observations by relating them to existing conceptual knowledge.
- **Abstract & Generalize:** Facilitates the creation of abstract categories and generalization from specific instances stored in memory.

**Core Components:**

- `OntologyService`: Implements the `IOntologyInterface`; handles the logic for reasoning over the ontology (e.g., categorization, inference) using data retrieved via the Memory Interface.
- `IOntologyInterface`: Defines the contract for interacting with the Ontology System.

*Knowledge Representation:*
- Schemas (`packages/contracts`):
    - `ConceptSchema`: Defines objects, entities, and abstract concepts.
    - `RelationSchema`: Defines semantic links between concepts.
    - `PropertySchema`: Defines attributes with confidence and provenance.
    - `CategorySchema`: Defines hierarchical taxonomies.

- Key Methods (Logic resides in `OntologyService`, persistence delegated):
    - `upsertConcept/retrieveConcepts/updateOntology`: Manages concepts/relations, delegating storage to `MemoryService`.
    - `categorize(entityDescription, candidateCategories)`: Classifies an entity using ontological structure.
    - `inferProperties(entityId, propertiesToInfer)`: Derives properties based on relations/inheritance.
    - (Potentially `checkConsistency`, `findRelatedConcepts`, etc.)
- Event Types: Potentially `ontology.concept.updated`, `ontology.relation.added`, `ontology.inference.completed`.

**Reasoning Capabilities:**

- **Structure Knowledge:** Organizes factual information into a network of concepts and relationships.
- **Enable Sophisticated Reasoning:** Supports inference like property inheritance, consistency checking, analogical mapping.
- **Contextualize Information:** Helps interpret observations by relating them to existing concepts.
- **Abstract & Generalize:** Facilitates creating abstract categories from specific instances.

**Key Differentiators:**

- **Focus:** The *structure, relationships, and meaning* within knowledge, enabling reasoning. Not just storage (`MemoryService`), behavioral adaptation (`LearningService`), self-knowledge (`SelfModelingService`), or broad synthesis (`ReflectionService`).
- **Representation:** Models knowledge as an interconnected graph or hierarchy, unlike the potentially flatter structure of raw Semantic Memory facts.
- **Function:** Primarily concerned with *reasoning over* existing knowledge rather than just retrieving it.

**Processing Type:**

- **Mixed / LLM-Dependent.** Basic concept/relation management via Memory is data processing. However, core reasoning functions like **`categorize` (understanding descriptions) and `inferProperties` (complex pathfinding or logical deduction) often require significant computational logic (e.g., graph traversal, rule engines) or sophisticated LLM calls.** These reasoning tasks can be asynchronous.

**Primary Integration Flow:**

```diagram/text
+-----------------------+ Query Concepts/Relations / +-----------------------+
| Cognitive Cycle (2.3) |   Infer Properties         |  Ontology Service     |
| Reflection (2.9.1)    |--------------------------->|        (2.10)         |
| Curiosity (2.9.2)     | Update Concepts/Relations  |                       |
| Self-Modeling (2.11)  |<---------------------------| Provides Structure    |
+-----------------------+   Structured Knowledge     +----------+------------+
        ▲                                                       │ ▲  │ Reason/Infer
        │                                                       │ │  │ (Rules/LLM)
        │                                Read/Write Concepts    │ │
        │                                  & Relations          ▼ │
        │                                +----------------------+----------+
        └────────────────────────────────|   Memory Service (Semantic)     |
                 Uses Structured         |          (2.4)                  |
                     Knowledge           +---------------------------------+

```

**Integration Points (Details):**

- **↔ Cognitive Cycle (2.3):** Provides structured world knowledge during Orient phase; Planner may consult ontology for task decomposition or feasibility checks.
- **↔ Memory System (2.4):** `OntologyService` uses `MemoryService` as its persistent store for concepts, relations, properties (likely within Semantic Memory tables/collections). `OntologyService` reads from Memory to perform reasoning.
- **← Curiosity System (2.9.2):** Receives confirmed findings from experiments which can lead to updates (new concepts, relations, confidence changes) applied via `OntologyService`. Curiosity consults the ontology (via Memory/Tools) during hypothesis generation.
- **← Reflection System (2.9.1):** Reflection insights may trigger updates to concepts or relations via `OntologyService`.
- **↔ Self-Modeling System (2.11):** Exchanges categorical knowledge about the agent itself (e.g., agent's `Concept` within the ontology).
- **→ Learning System (2.8):** Provides the conceptual framework that learning algorithms might use for generalization or structuring learned policies/heuristics.
- **→ Event Bus (3.1):** Emits events when significant ontological structures are updated or inferred.
- **→ Statistics (3.2):** Provides metrics on ontology size, complexity, query/inference latency.

## 2.11 Self-Modeling System

This system enables the agent to develop, maintain, and reason about an explicit model of its own identity, capabilities, limitations, and nature. It underpins functions like metacognition, self-awareness, and appropriate role adherence.

**Purpose & Design:**

- **Maintain Self-Concept:** Stores and updates the agent's beliefs about itself.
- **Assess Capabilities:** Allows the agent (or planner) to realistically evaluate its ability to perform tasks.
- **Define Agency:** Establishes the agent's understanding of its scope of control and influence within the environment.
- **Distinguish Role vs. System:** Helps the agent differentiate between its assigned character persona and its underlying system architecture/identity.
- **Enable Metacognition:** Facilitates reflection on the agent's own thinking processes and performance (partially handled via `performReflection`, likely orchestrated by the main `ReflectionService`).

**Core Components:**

- `SelfModelingService`: Implements the `ISelfModelingInterface`; handles the logic for reasoning about the self-model and processing updates, using data retrieved via the Memory Interface.
- `ISelfModelingInterface`: Defines the contract for interacting with the Self-Modeling System.

*Knowledge Representation:*
- Schemas (`packages/contracts`):
    - `SelfModelSchema`: The core schema defining the agent's self-understanding. It likely incorporates or references:
        - `AgentCapabilitySchema`: Zod schema for abilities and their confidence levels.
        - `AgencyBoundarySchema`: Zod schema defining scope of agent's control/influence.
        - `CharacterRoleSchema`: Zod schema for narrative persona distinct from system.
        - `SelfReflectionSchema`: Zod schema for metacognitive observations about operation.
- Persistence: Self-model data is primarily stored and retrieved via the `MemoryService`.

*Core Functions:*
- `getSelfConcept()`: Retrieves the current self-model (delegated to Memory).
- `updateSelfConcept()`: Applies updates to the self-model (delegated to Memory).
- `updateCapability(capability, confidence)`: Specific update logic for abilities.
- `assessAgencyBoundary(actionDescription)`: Reasoning based on the model's defined boundaries.
- `distinguishRoleFromSystem()`: Reasoning based on the model's role vs. awareness fields.
- `performReflection()`: (As currently in `SelfModelingService`) Analyzes recent experiences to suggest *self-specific* updates (this is likely called *by* the main `ReflectionService`).
- `queryCapabilities(taskDescription)`: Reasoning to assess ability based on the model.
- `getAgencyBoundaries()`: Retrieves boundaries directly from the model.

- Event Types: Potentially `agent.state.self_model_updated`.

**Key Differentiators:**

- **Focus:** Explicit knowledge about the *agent itself*, its traits, abilities, and limitations. Not general world knowledge (`OntologyService`), specific past events (`Episodic Memory`), behavioral adaptation (`LearningService`), or broad synthesis (`ReflectionService`).
- **Perspective:** Internal, first-person understanding ("What can *I* do?", "Who am *I*?").

**Processing Type:**

- **Mixed / LLM-Dependent.** Basic state retrieval/update via Memory is data processing. However, **`performReflection` (analyzing experiences for self-insights) and potentially complex `queryCapabilities` or `assessAgencyBoundary` logic can require significant LLM calls** for reasoning and interpretation. These LLM-dependent parts might operate asynchronously, especially the reflection aspect.

**Primary Integration Flow:**

```diagram/text
+-----------------------+  Updates based on  +---------------------------+
| Reflection Service    |------------------->| SelfModeling Service      |
| (2.9.1)               |  Reflection        |        (2.11)             |
+-----------------------+                    +------------+--------------+
                                                          | ▲  │ Read/Write
+-----------------------+  Updates based on               │ │  │ Self-Model Data
| Curiosity Service     |  Experiment Results             │ │
| (2.9.2)               |-------------------------------->│ │
+-----------------------+                                 ▼ │
                               +----------------------------+------------+
                               |       Memory Service (Self-Model Data)  |
                               |                (2.4)                    |
                               +------------------+----------------------+
                                                  ▲
+-----------------------+ Query Self-Concept/Caps | Reads Self-Model
| Cognitive Cycle (2.3) |-------------------------+
| Planner (2.1.4)       |
| Ontology (2.10)       | Provides Self-Knowledge
|                       |<----------------------------------------------+
+-----------------------+
```

**Integration Points (Details):**

- **↔ Memory System (2.4):** `SelfModelingService` uses `MemoryService` as its persistent store for the `SelfModelSchema`. It reads from and writes updates to this store.
- **← Reflection System (2.9.1):** Receives insights derived from broader reflection, triggering specific updates to the self-model (e.g., adjusting capability confidence based on synthesized experience). `ReflectionService` likely calls `SelfModelingService.performReflection` or similar methods to apply these self-focused updates.
- **← Curiosity System (2.9.2):** Receives results from specific capability-testing experiments, leading to updates in the self-model (e.g., confirming/denying a capability). Curiosity consults the self-model (via Memory/Tools) during hypothesis generation.
- **→ Cognitive Cycle (2.3) / Planner (2.1.4):** Provides the agent's understanding of its capabilities (`queryCapabilities`) and limitations (`getAgencyBoundaries`) to inform planning and decision-making during the Orient/Decide phases.
- **↔ Ontology System (2.10):** Exchanges categorical knowledge about the agent itself (e.g., the agent might be represented as a `Concept` with specific properties derived from the self-model).
- **→ Learning System (2.8):** (Indirect) An accurate self-model helps set realistic expectations, which can influence reward calculation or learning goals. Failures assessed against capabilities might provide stronger learning signals.
- **→ Event Bus (3.1):** Emits events when the self-model is significantly updated (`agent.state.self_model_updated`).
- **→ Statistics (3.2):** Provides metrics on self-model evolution, capability confidence changes, etc.

## 2.12 Interaction Model: Environment Simulation & Emergent Communication

Agents do not communicate directly or through a central manager. Instead:

1. **Actions affect the Environment:** An agent's `ActionSystem` dispatches an action (e.g., `speak`, `move`) to the relevant `Capability Extension`.
2. **Capability Executes in Simulation:** The `Capability Extension` interacts with the **Environment Simulation Layer**, causing a change (e.g., audio output generated at agent's location, agent's position updated).
3. **Environment Broadcasts Effects:** The Environment Simulation Layer determines which *other* agents can perceive the *effects* of this action based on proximity, line-of-sight, hearing range, etc.
4. **Perception by Other Agents:** The simulation layer pushes the relevant raw sensory data (visual changes, audio streams) to the appropriate `Perception Extensions` (Visual, Auditory) of the observing agents.
5. **Internal Perception Processing:** Each observing agent's `Perception System` processes this raw data into meaningful `AgentPerceptionEvent`s (e.g., `{ type: 'message', visualId: 'agent_xyz', content: 'Hello', timestamp: ... }`, `{ type: 'agent_moved', visualId: 'agent_abc', newPosition: {...}, timestamp: ... }`).
6. **Cognitive Cycle Trigger:** These events trigger the observing agents' Cognitive Cycles.

**Emergent Communication:** Communication thus arises naturally from agents performing actions (like speaking) within the shared environment and other agents perceiving those actions. Turn-taking, topic coherence, and relationship dynamics emerge from the individual agents' perception, memory, goals, and decision-making processes, rather than being dictated by a central controller.
