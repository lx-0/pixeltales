# 3. Instrumentation & Advanced Features

## 3.1 Event Bus & Communication

The Event Bus is the central nervous system of the PixelTales architecture, enabling asynchronous, decoupled communication between subsystems while providing the foundation for observability and analytics.

### 3.1.1 Architecture & Design Principles

The Event Bus implements a publish-subscribe pattern with the following key characteristics:

- **Decoupled Communication**: Subsystems publish events without knowledge of subscribers, enabling independent development and testing.
- **Typed Events**: All events conform to Zod schemas for runtime validation and type safety.
- **Hierarchical Structure**: Event types follow a domain-based hierarchy (e.g., `agent.action.speak`, `memory.write.fact`).
- **Buffering Capabilities**: Events can be buffered for high-throughput scenarios and to handle temporary subscriber unavailability.
- **Filtering & Routing**: Subscribers can apply filters based on event properties (e.g., only receiving events for specific agents).
- **Priority Levels**: Critical events (e.g., exceptions, system state changes) can be prioritized.

```diagram/text
                       +----------------+
                       |                |
                       |   Publishers   |
                       |                |
                       +-------+--------+
                               |
                               | Events (Typed with Zod)
                               v
+--------------------+   +-----+------------+   +----------------------+
|                    |   |                  |   |                      |
|  Event Formatters  +-->+    EVENT BUS     +-->+   Event Processors   |
|                    |   |                  |   |                      |
+--------------------+   +-----+------------+   +----------------------+
                               |
                               | Subscriptions
                               v
                       +-------+--------+
                       |                |
                       |  Subscribers   |
                       |                |
                       +----------------+
```

### 3.1.2 Core Components

- **`EventBusService`**: Central implementation of the event bus.
    - `publish(eventType: string, payload: any): void`: Emit events to subscribers.
    - `subscribe(eventType: string, handler: (payload: any) => void): Subscription`: Register listeners.
    - `unsubscribe(subscription: Subscription): void`: Cleanup subscriptions.
    - `getEventHistory(type: string, limit: number): Event[]`: Retrieve recent events (for debugging).

- **`EventSchema`**: Base Zod schema for all events, ensuring consistency.

  ```typescript
  const EventSchema = z.object({
    id: z.string(),
    type: z.string(),
    timestamp: z.number(),
    source: z.string(),
    payload: z.any(),
    correlationId: z.string().optional(),
  });
  ```

- **`EventFilterService`**: Allows creating complex filtering criteria.
    - `createFilter(criteria: FilterCriteria): EventFilter`: Generates filter functions.
    - `applyFilter(events: Event[], filter: EventFilter): Event[]`: Filters event collections.

- **`EventPersistenceService`**: Optional component for durable event storage.
    - `persistEvent(event: Event): Promise<void>`: Stores events for later analysis.
    - `queryEvents(criteria: QueryCriteria): Promise<Event[]>`: Retrieves historical events.

### 3.1.3 Key Event Types

The event system uses a hierarchical namespace format:

1. **Agent Events**:
   - `agent.initialized`: Agent creation and configuration.
   - `agent.action.*`: All agent actions (speak, move, etc.).
   - `agent.state.changed`: Updates to agent dynamic state.
   - `agent.perception.received`: New perceptions processed.

2. **Memory Events**:
   - `memory.observation.added`: New observations recorded.
   - `memory.fact.upserted`: Knowledge base updates.
   - `memory.retrieval.requested`: Memory access operations.
   - `memory.summarization.completed`: Long-term memory processing.

3. **Cognitive Events**:
   - `cognitive.cycle.started/completed`: Timing for OODA loop phases.
   - `cognitive.plan.created`: HTN planning results.
   - `cognitive.reflection.completed`: Self-reflection outputs.

4. **Learning Events**:
   - `learning.reward.recorded`: Reinforcement signals.
   - `learning.policy.updated`: Strategy modifications.
   - `learning.discovery.*`: New insights and breakthroughs.

5. **System Events**:
   - `system.error`: Error conditions requiring attention.
   - `system.resource.usage`: Computational resource tracking.
   - `system.llm.request`: LLM API interactions.

### 3.1.4 Integration with Analytics

The Event Bus is directly connected to the Statistics & Monitoring subsystem:

- All significant events are available for real-time dashboards.
- Events can be aggregated into time-series metrics.
- Complex event patterns can trigger alerts or notifications.
- Historical event logs enable retrospective analysis and debugging.

```typescript
// Example: StatsCollector subscribing to Event Bus
class StatsCollector implements OnModuleInit {
  constructor(private readonly eventBus: EventBusService) {}

  onModuleInit() {
    // Subscribe to all agent actions
    this.eventBus.subscribe('agent.action.*', this.handleAgentAction.bind(this));

    // Subscribe to memory operations with filtering
    this.eventBus.subscribe(
      'memory.*',
      this.handleMemoryEvent.bind(this),
      { filter: event => event.payload.size > 1000 } // Only large memory operations
    );
  }

  private handleAgentAction(event: Event) {
    // Process and store metrics...
  }

  private handleMemoryEvent(event: Event) {
    // Process and store metrics...
  }
}
```

### 3.1.5 Communication Patterns

Beyond simple pub/sub, the Event Bus enables several advanced communication patterns:

1. **Request-Response**: Using correlation IDs to match responses with requests.

    ```typescript
    // Request
    const correlationId = uuidv4();
    this.eventBus.publish('memory.request.facts', {
      query: 'character traits',
      correlationId
    });

    // Response handler (registered earlier)
    this.eventBus.subscribe('memory.response.*', (event) => {
      if (event.correlationId === correlationId) {
        // Handle this specific response
      }
    });
    ```

2. **Broadcast Notifications**: One-to-many communications.

    ```typescript
    this.eventBus.publish('system.notification.maintenance', {
      message: 'System maintenance in 5 minutes',
      severity: 'warning'
    });
    ```

3. **Command Pattern**: Directing specific subsystems to perform actions.

    ```typescript
    this.eventBus.publish('agent.command.pause', {
      agentId: 'agent-123',
      reason: 'user requested'
    });
    ```

4. **Event Sourcing**: Rebuilding state from event streams.

    ```typescript
    const agentState = this.eventBus
      .getEventHistory(`agent.*.${agentId}`)
      .reduce((state, event) => this.eventReducer(state, event), initialState);
    ```

The Event Bus forms the backbone of the PixelTales architecture, enabling not just interprocess communication but also comprehensive system observability, debugging capabilities, and data collection for analytics and machine learning.

## 3.2 Statistics & Logging Concept

Real‑time and historical telemetry are core to PixelTales—detailed stats validate agent behavior, reveal insights, and drive continuous improvement.

### 3.2.1 Key Metrics

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

### 3.2.2 Instrumentation & Data Flow

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

#### 3.2.2.1 Real‑Time Statistics Architecture

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

#### 3.2.2.2 Stats Type Definitions (TypeScript & Zod)

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

### 3.2.3 Logging & Storage

- **Structured logs** (Pino/JSON) with traceId and correlationId in each event
- **TimeSeriesDB** (e.g. InfluxDB, Prometheus remote) for high‑frequency metrics
- **OLAP store** (e.g. ClickHouse) for aggregated analytics and ad‑hoc queries
- **Archive logs** for audit and compliance

### 3.2.4 Dashboard & UX Mockup

```diagram/text
+---------------------------------------------------------------------------------+
| PixelTales Dashboard                                                            |
|---------------------------------------------------------------------------------|
| [Scene View]               | [Stats Panel]                                      |
|  ┌───────────────┐         |  ┌─────────────┐  ┌─────────────┐  ┌───────┐       |
|  |   Phaser 3    |         |  | Agent: Alice|  | Agent: Bob  |  |Summary|       |
|  |  Scene Render |         |  | msgs: 87    |  | msgs: 91    |  |msgs:178|      |
|  └───────────────┘         |  | avg RT:45s  |  | avg RT:46s  |  | cost: $X|     |
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

### 3.2.5 UX Considerations

- **Performance**: lazy load heavy charts, paginate logs
- **Clarity**: consistent color‑coding per agent, clear legends
- **Accessibility**: keyboard navigation, screen‑reader labels on charts
- **Export**: CSV/JSON dump for external analysis

## 3.3 Psychological Evaluation System

This system **provides external analysis** of the agent's behavior and interaction patterns from a psychological perspective, offering insights into its emergent "personality" and behavioral tendencies **for observation and tuning purposes**. **Crucially, the agent itself does not have access to these evaluations.**

### 3.3.1 Purpose and Goals

- Enable **external observation** of the agent's psychological profile as it evolves.
- Provide a framework for **understanding and analyzing** the agent's behavior using established psychological models.
- Allow for **comparison across different scenarios and over time** by developers and researchers.
- Generate insights that can **inform agent design improvements and tuning**.

### 3.3.2 Evaluation Framework

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

### 3.3.3 Implementation Details

- A dedicated `PsychEvalService` **passively monitors** agent behavior by subscribing to events on the Event Bus.
- Specialized LLM prompts analyze conversation history and agent actions **offline or asynchronously**.
- Evaluation results are stored with timestamps for **external temporal analysis and visualization**.
- Updates are published to a dedicated **monitoring frontend** in real-time via WebSocket (separate from the main user view if necessary).
- Caching mechanism prevents redundant evaluations for minor state changes.

**Note:** The agent's core cognitive loop is *not* blocked by this external analysis.

### 3.3.4 Visualization Components

The psychological evaluation data is presented through an RPG-style character sheet interface. **This visualization directly supports the project's gamification goals (Section 0) by translating abstract psychological metrics into familiar RPG tropes, making agent personality development tangible and comparable, complementing the event-based learning notifications (Chapter 12).**

```diagram/text
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

```diagram/text
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

```diagram/text

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

## 3.4 Inter-Agent Communication Analysis

This component of the **external evaluation system** analyzes communication patterns between agents, providing insights into relationship dynamics and interaction qualities **for monitoring and research**. This component is critical for **understanding** how agents influence each other and collectively shape the scene narrative, **but the agents themselves are unaware of this analysis.**

```diagram/text

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
- **Social Graph**

The `PsychEvalService` (or a dedicated `CommunicationAnalysisService`) processes this data by:

1. Collecting interaction events through the `EventBus` subscription to `agent.action` events.
2. Analyzing sequential message pairs **asynchronously** to detect patterns and relational indicators.
3. Computing metrics based on timing data, semantic content, and sentiment analysis.
4. **Correlating** communication behaviors with individual agent personality profiles (also derived externally).
5. Constructing relationship graphs with weighted, directed edges between agents **for visualization**.
6. Publishing relationship updates **to monitoring dashboards** via the `EventBus` or dedicated endpoints.

This inter-agent analysis complements individual psychological profiles to provide a comprehensive **external understanding** of both individual agent characteristics and emergent social dynamics within the scene.

## 3.5 Agent State Visualization

The Agent State Visualization provides a view into the agent's internal state, including perception, memory, and cognitive cycles.

### 3.5.1 Purpose and Goals

- Make the agent's inner workings transparent and legible to users
- Allow exploration of the agent's current state as well as historical states
- Provide different levels of detail through expandable/collapsible views
- Enable correlation between state transitions and agent behaviors

### 3.5.2 State Broadcast System

- `StateBroadcastService` captures and emits agent state snapshots
- Serialized state objects are transmitted via WebSocket
- Differential updates minimize network traffic
- States are associated with conversation utterances and actions
- Historical states are persisted for playback and analysis

### 3.5.3 Visualization Interface

The agent's state is displayed through an RPG-style character sheet and quest log interface:

```diagram/text

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

### 3.5.4 Historical State Navigation

- Timeline interface for browsing agent state history
- Snapshot comparison to highlight state differences
- Correlation between state transitions and conversation events
- Ability to replay the agent's "thought process" over time

## 3.6. Learning Notification System

The Learning Notification System visualizes agent knowledge acquisition through gamified in-game notifications, making cognitive development visible and engaging for users.

### 3.6.1 Purpose and Goals

- Visualize key **cognitive development moments** in agent learning, framed as distinct **Learning Events**.
- Provide engaging, RPG-style feedback on agent evolution through explicit **Gamification** mechanics.
- Create a sense of progression and growth via **XP Calculation** and skill association.
- Make internal state changes visible to the user through noticeable **Frontend Alerts**.

### 3.6.2 Notification Types

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

### 3.6.3 Implementation Details

The notification system consists of three main components, each contributing to the **gamification** loop:

1. **Learning Event Detection**:
    - `LearningDetectionService` monitors memory operations to identify significant **Learning Events** based on predefined patterns or significance thresholds.
    - Pattern matchers identify these moments (e.g., forming a new belief, discovering a relationship, updating self-model significantly).
    - Significance thresholds filter minor updates, ensuring only meaningful progress triggers notifications.
    - Category classifiers determine the type of **Learning Event** (World, Social, Self, Skill, Concept).

2. **Notification Generation**:
    - `NotificationFormatter` creates human-readable descriptions tailored to the specific **Learning Event**.
    - `XPCalculator` performs the core **XP Calculation**, assigning experience points based on the event's significance and novelty.
    - `CategoryAssigner` determines the relevant skill category (e.g., Social Understanding, World Knowledge) for **XP Allocation**, contributing to the RPG feel.
    - `NotificationEnhancer` adds visual styling elements (icons, colors) reinforcing the **gamification**.

3. **Frontend Rendering**:
    - The generated notification payload is delivered to the client as a **Frontend Alert** via WebSocket for real-time updates.
    - An animated overlay system displays the notification prominently but unobtrusively, handling stacking and timing.
    - Themeable notification templates ensure visual consistency with the RPG aesthetic.
    - Sound effects and particle effects can be added to enhance the impact of the **Frontend Alert** and **gamification**.

```diagram/text

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

### 3.6.4 Notification Appearance

Notifications are styled to match the game's pixel art aesthetic, with:

- Distinctive iconography for each notification type
- Color-coding by knowledge domain
- Animated entrance and exit effects
- XP indicators with domain icons
- "Stacking" behavior for rapid sequences of related insights

**This visual presentation is key to the system's Gamification aspect, turning abstract learning moments into rewarding player-facing feedback.**

```diagram/text

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

### 3.6.5 Integration Points

- **Memory Services**: Monitors write operations to detect learning events
- **Event Bus**: Subscribes to learning-related events
- **Frontend WebSocket**: Delivers notifications to client
- **Persistence Layer**: Stores notification history for review
- **Psychological Profile**: Updates stats based on learning patterns **(This connection is now external: Psych Eval consumes events, it doesn't directly update profile *used by* the agent)**
- **Agent State Visualization**: Highlights affected knowledge areas

By making cognitive development visible through **gamified frontend alerts** triggered by specific **learning events** and awarding calculated **XP**, the system creates a more engaging experience where users can observe and appreciate the emergent intelligence of agents as they explore, learn, and evolve.
