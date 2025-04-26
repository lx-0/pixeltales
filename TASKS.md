# PixelTales Agentic Architecture Migration Tasks

## Priority Legend

- [P1] Critical: core systems and prerequisites for the agentic framework.
- [P2] Important: necessary modules that rely on P1 and improve core functionality.
- [P3] Optional/Polish: UX, documentation, and cleanup tasks after core features.

This file tracks the step-by-step tasks needed to transform the existing PixelTales codebase into the planned agent-centric architecture.

**Note:** Placeholder `any` types are used temporarily for contract imports due to monorepo resolution issues. These will be replaced later.

## 1. Project & Directory Structure [P1]

(See [Blueprint Section 4.4](docs/agent-architecture/04-integration-architecture-performance.md#4.4))
- [X] Create `apps/backend/src/agent/` folder to house all agent-specific modules.
- [X] Scaffold subfolders under `agent/`: `memory/`, `planner/`, `learning/`, `ontology/`, `curiosity/`, `self-modeling/`, `extensions/`, `internal-tools/`, `cognitive-cycle/` and core files (`agent.service.ts`, `agent.factory.ts`, `agent.module.ts`, `agent.state.ts`).
- [P] Update `tsconfig.json` and import paths to reflect the new folder layout (Partially done with placeholders, needs final resolution).

## 2. Contracts & Schemas [P1]

(See [Blueprint Section 4.2](docs/agent-architecture/04-integration-architecture-performance.md#4.2))
- [X] Define and export agent stats schemas in `packages/contracts/src/agent/Metrics.ts`.
- [X] Ensure `MetricPointSchema`, `AgentActionEventMetricsSchema`, etc. are defined.
- [X] Define `IEventBus` interface in `apps/backend/src/core/event-bus.interface.ts`. (See [Blueprint Section 3.1](docs/agent-architecture/03-instrumentation-features.md#3.1)) - **Updated DomainEvent union.**
- [X] Define `IMemoryInterface` interface in `apps/backend/src/agent/memory/memory.interface.ts`. (See [Blueprint Section 2.4](docs/agent-architecture/02-core-subsystems.md#2.4))
- [X] Define `ILearningInterface` interface in `apps/backend/src/agent/learning/learning.interface.ts`. (See [Blueprint Section 2.8](docs/agent-architecture/02-core-subsystems.md#2.8))
- [X] Define `IPlannerService` interface in `apps/backend/src/agent/planner/planner.interface.ts`. (See [Blueprint Section 2.3.1](docs/agent-architecture/02-core-subsystems.md#2.3.1))
- [X] Define `ICapabilityExtension` interface in `apps/backend/src/agent/extensions/capability.extension.interface.ts`. (See [Blueprint Section 2.6](docs/agent-architecture/02-core-subsystems.md#2.6))
- [X] Define `IInternalToolsInterface` interface in `apps/backend/src/agent/internal-tools/internal-tools.interface.ts`. (See [Blueprint Section 2.7](docs/agent-architecture/02-core-subsystems.md#2.7))
- [X] Define `IRewardFunction` interface in `apps/backend/src/agent/learning/reward.function.interface.ts`.
- [X] Define `IMetricsAdapter` interface in `apps/backend/src/core/stats/adapters/metrics.adapter.interface.ts`. (See [Blueprint Section 3.2](docs/agent-architecture/03-instrumentation-features.md#3.2))
- [X] Define `IMetricFormatter` interface in `apps/backend/src/core/stats/formatters/metric.formatter.interface.ts`. (See [Blueprint Section 3.2](docs/agent-architecture/03-instrumentation-features.md#3.2))
- [X] Define `IAgentLlmService` interface in `apps/backend/src/agent/llm/agent-llm.interface.ts`.
- [X] Define `IOntologyInterface` interface in `apps/backend/src/agent/ontology/ontology.interface.ts`. (See [Blueprint Section 2.10](docs/agent-architecture/02-core-subsystems.md#2.10))
- [X] Define `ISelfModelingInterface` interface in `apps/backend/src/agent/self-modeling/self-modeling.interface.ts`. (See [Blueprint Section 2.11](docs/agent-architecture/02-core-subsystems.md#2.11))
- [X] Define `IActionService` interface in `apps/backend/src/agent/action/action.interface.ts`. (See [Blueprint Section 2.5](docs/agent-architecture/02-core-subsystems.md#2.5))
- [X] Define `IPerceptionExtension` interface in `apps/backend/src/agent/extensions/perception.extension.interface.ts`. (See [Blueprint Section 2.2](docs/agent-architecture/02-core-subsystems.md#2.2))
- [X] Define event schemas (`BaseEvent`, `AgentInternalEvent`, `AgentPerceptionEvent`, `SensoryEvent`, `SimulationEvent`, `DomainEvent`) in contracts. **(Updated `AgentInternalEvents` and `DomainEvents` Feb 20)**
- [X] Define payload structures for specific event types (e.g., `CognitiveCyclePhaseCompletedPayload`, `AgentDynamicStateUpdatedPayload`). **(Added `AgentDynamicStateUpdatedPayload` Feb 20)**
- [X] Define `AgentAction` schemas, including optional `planContext`. **(Added `planContext` Feb 20)**

## 3. Memory System [P1]

(See [Blueprint Section 2.4](docs/agent-architecture/02-core-subsystems.md#2.4))
- [X] Create base `agent/memory/episodic-memory.service.ts`. **(Drizzle persistence logic exists [P] - TODOs remain)**
- [X] Create base `agent/memory/semantic-memory.service.ts`. **(Drizzle persistence logic for facts [X], self-model [X], and concepts [X] exists)**
- [X] Create `agent/memory/memory.service.ts` (Facade).
- [X] Create `agent/memory/memory.module.ts` providing `MEMORY_INTERFACE`.
- [X] Implement actual persistence logic for memory services.
- [X] Integrate calls to `memoryInterface` in the Cognitive Cycle and other services. **(Orientation, Action integrated; Reflection pending)**

## 4. Planner (HTN) System [P2]

(See [Blueprint Section 2.1.4](docs/agent-architecture/02-core-subsystems.md#2.1.4) & [2.3.1](docs/agent-architecture/02-core-subsystems.md#2.3.1))
- [X] Create base `agent/planner/htn-planner.service.ts` implementing `IPlannerService` (placeholder methods).
- [X] Create `agent/planner/planner.module.ts` providing `PLANNER_SERVICE`.
- [X] Hook planner into the Decide & Plan phase in `CognitiveCycleService`.
- [X] Update planner to use memory service for plan persistence.
- [X] Update planner to use `planContext` in action payloads. **(Updated Feb 20)**
- [X] Implement actual HTN planning logic. **(LLM generates AgentPlan, Cycle persists & gets next step)**

## 5. Learning & Adaptation [P2]

(See [Blueprint Section 2.8](docs/agent-architecture/02-core-subsystems.md#2.8))
- [X] Create base `agent/learning/learning.service.ts` implementing `ILearningInterface`.
- [X] Define and Implement `RewardFunction` service implementing `IRewardFunction` in `agent/learning/reward.function.ts`. **(Placeholder logic implemented)**
- [X] Create `agent/learning/learning.module.ts`.
- [ ] Schedule periodic policy updates and meta-learning routines.
- [X] Connect reward recording to post-action in `CognitiveCycleService`. **(Uses placeholder reward inputs - Needs integration with Goal/Conversation/Curiosity systems for full reward signal)**
- [ ] Implement actual learning algorithms and policy updates in `LearningService`.

## 6. Internal Tools & Capability Extensions [P2]

(See [Blueprint Section 2.6](docs/agent-architecture/02-core-subsystems.md#2.6) & [2.7](docs/agent-architecture/02-core-subsystems.md#2.7))
- [X] Create base `agent/internal-tools/internal-tools.service.ts` providing facade methods (placeholders).
- [X] Create base extension classes: `SpeechOutputExtension`, `MotionControlExtension`, `VisualPerceptionExtension`, `AuditoryPerceptionExtension` (placeholders).
- [X] Create `agent/internal-tools/internal-tools.module.ts`.
- [X] Create `agent/extensions/extensions.module.ts`.
- [P] Implement logic within specific internal tool methods (Memory tools delegated; others are stubs). **(Memory retrieve/upsert integrated in CognitiveCycle)**
- [X] Implement logic within capability extensions (interacting with simulation layer). **(Speech/Motion emit events; Visual/Auditory process raw events & publish perception events)**

## 7. Cognitive Cycle & Agent Lifecycle [P1]

(See [Blueprint Section 2.1](docs/agent-architecture/02-core-subsystems.md#2.1) & [2.3](docs/agent-architecture/02-core-subsystems.md#2.3))
- [X] Create `agent/cognitive-cycle/cognitive-cycle.service.ts`.
- [X] Create `AgentService` and `AgentFactory`.
- [X] Implement `AgentFactory` to create initial `AgentState`.
- [X] Implement `AgentService` for agent management and basic loop triggering.
- [X] Update `AgentService.updateAgentDynamicState` to emit event. **(Done Feb 20)**
- [X] Create `agent/cognitive-cycle/cognitive-cycle.module.ts`.
- [P] Implement detailed logic within `CognitiveCycleService` phases. **(Orientation fetches real context, Decide/Plan has improved System-1/2 allocation & initial tool integration, Action logs action to memory, Learn records reward; Reflection trigger integrated)**
- [X] Implement Agent State Update mechanism fully within/after cycle. **(Refactored to AgentRuntimeState)**
- [P] Implement actual agent loop control (Hybrid: Event-driven + Periodic Tick).
- [X] Replace mock perceptions with real source in SimulationService. **(Sim now publishes raw events; Perception Extensions handle processing)**

## 8. Event Bus & Stats Pipeline [P1]

(See [Blueprint Section 3.1](docs/agent-architecture/03-instrumentation-features.md#3.1) & [3.2](docs/agent-architecture/03-instrumentation-features.md#3.2))
- [X] Create `core/event-bus.interface.ts` and base `event-bus.service.ts`. **(Includes static createEvent, updated DomainEvent)**
- [X] Create base `core/stats/stats-collector.service.ts`.
- [X] Implement subscription logic in `StatsCollectorService` for dynamic state and cycle phase events. **(Done Feb 20)**
- [X] `DefaultMetricFormatter` implementation exists. **(Handles AgentAction, StepTiming, Reward, DynamicState events; some type casts needed)**
- [X] Create `core/stats/metrics.module.ts` wiring collector, formatter, adapters. // Corrected imports after resolving duplicates
- [X] Implement `TimeSeriesAdapter` and `OlapAdapter` to write to SQLite `metrics` table using Drizzle.
- [X] Implement `IMetricsAdapter` interface and concrete adapters (`TimeSeriesAdapter`, `OLAPAdapter`) in `core/stats/adapters/`. // **Implemented using SQLite target.**
- [X] Implement `IMetricFormatter` interface and concrete formatters in `core/stats/formatters/`. // **Default formatter exists and handles key events.**
- [X] Implement formatting and storage logic in `StatsCollectorService`. // Basic logic done, subscription needs refinement. **(Formatter and Adapters implemented for SQLite)**

## 9. Core Module & Other Services [P1/P2]

- [X] Create base `core/config.service.ts`.
- [X] Create base `core/notifications/notification.service.ts`.
- [X] Create `core/notifications/notification.module.ts`.
- [X] Implement actual config loading in ConfigService.
- [ ] Implement notification dispatch logic (WebSockets?). (See [Blueprint Section 3.6](docs/agent-architecture/03-instrumentation-features.md#3.6))
- [X] Create `core/core.module.ts` providing/exporting core services.
- [X] Create `AgentModule` (`apps/backend/src/agent/agent.module.ts`) importing necessary submodules.
- [X] Create `AgentLlmModule` and placeholder `AgentLlmService`.
- [X] Create `OntologyModule` and placeholder `OntologyService`. (See [Blueprint Section 2.10](docs/agent-architecture/02-core-subsystems.md#2.10))
- [X] Create `SelfModelingModule` and placeholder `SelfModelingService`. (See [Blueprint Section 2.11](docs/agent-architecture/02-core-subsystems.md#2.11))
- [X] Create `CuriosityModule` and placeholder `CuriosityService`. (See [Blueprint Section 2.9](docs/agent-architecture/02-core-subsystems.md#2.9))

## 10. Refactor Existing Services [P2]

(See [Blueprint Section 4.6](docs/agent-architecture/04-integration-architecture-performance.md#4.6))
- [X] Update `SimulationService` to use `EventBusService` and correct perception event types.
- [X] Implement `CircuitBreakerService` and integrate with `LlmService` calls.

## 11. Frontend Integration [P3]

- [ ] Update frontend to consume new stats endpoints or streams.
- [ ] Refactor chart components to bind to typed stats models.
- [ ] Adjust UI to use new agent folder structure.
- [ ] Ensure history-mode replay uses enriched event payloads.
- [ ] Integrate Learning Notifications display. (See [Blueprint Section 3.6](docs/agent-architecture/03-instrumentation-features.md#3.6))
- [ ] Integrate Agent State Visualization display. (See [Blueprint Section 3.5](docs/agent-architecture/03-instrumentation-features.md#3.5))
- [ ] Integrate Psychological Profile display. (See [Blueprint Section 3.3](docs/agent-architecture/03-instrumentation-features.md#3.3))
- [ ] Integrate Communication Analysis display. (See [Blueprint Section 3.4](docs/agent-architecture/03-instrumentation-features.md#3.4))

## 12. Testing & Validation [P3]

- [ ] Write unit tests for each new agent submodule (Memory, Planner, Learning, InternalTools, CognitiveCycle, etc.).
- [ ] Write integration tests for the EventBus → StatsCollector → Adapter pipeline.
- [ ] End-to-end tests simulating an agent conversation with metrics collection.

## 13. Documentation & Cleanup [P3]

- [X] Finalize `docs/agent-architecture.md` structure and diagrams.
- [ ] Update `README.md` with agentic architecture and new module descriptions.
- [ ] Update `project-summary.md`.
- [ ] Remove any deprecated code or modules (e.g., old orchestrator files if any remain, generic `createEvent` function).
- [ ] Resolve temporary `any` type placeholders.

## 14. Database Schema Migration [P1]

**Note:** Because the app is still in development (not live), we can skip rolling migrations on production. Instead, adjust the **initial database schema migration file** (e.g., `migrations/0001_initial.sql` or equivalent) to include required new tables:

- [X] Define schema for `episodic_memory`
- [X] Define schema for `semantic_memory` (facts, concepts, relations)
- [X] Define schema for `plans` and `plan_nodes`
- [X] Define schema for `metrics` (if using relational DB alongside TSDB)
- [X] Define schema for `rewards` / `experiences`
- [X] Define schema for `hypotheses`, `experiments`
- [X] Define schema for `agent_self_models`
- [ ] Define schema for external analysis tables (`psych_profiles`, `relationship_graphs`) if needed.

## 15. Pre-Implementation Discussion [P1]

- [ ] (1) Design conversation summarization & state persistence: implement summary generation routines, integrate summaries into memory, and define state snapshot and recovery APIs.
- [ ] (3) Design concurrency and consistency controls for memory/state (e.g., Redis locks or optimistic versioning).
- [ ] (4) Establish performance budgets and backpressure strategies for `StatsCollectorService` (batch sizes, timeouts, queue limits).
- [ ] (5) Draft frontend WebSocket event versioning scheme and update the event spec for new stats payloads to ensure contract stability.
- [ ] Finalize database schema definitions for new tables (`episodic_memory`, `semantic_memory`, `plan_nodes`, `metrics`, `rewards`) including columns, types, foreign keys, and indexes.
- [ ] Define configuration keys and feature flags for toggling new subsystems (stats pipeline, circuit-breaker, memory pruning) and update `app-config` accordingly.
- [ ] Identify and sanitize any sensitive data in event payloads; define rate-limiting rules for event publication to avoid floods.
- [ ] Update the testing strategy: outline unit, contract (Zod schema), integration, and E2E tests with EventBus and LLM mocks.
- [ ] Update CI/CD workflows: add pre-commit or pipeline steps to run Zod validation, linting, and build checks for new modules.
- [ ] Select observability and alerting backends (e.g., Sentry, Prometheus) and define critical metrics and alert thresholds for LLM errors, memory failures, and stats pipeline issues.

## 16. Psychological Evaluation System [P2]

(See [Blueprint Section 3.3](docs/agent-architecture/03-instrumentation-features.md#3.3))
- [ ] Create `psych-eval/psych-eval.module.ts` and core service structure.
- [ ] Implement `PsychEvalService` with RPG-style stat evaluation methods (`evaluateBaseStats()`, `evaluateSpecialAbilities()`, `evaluateStatusEffects()`).
- [ ] Design Zod schemas for RPG character profiles (base stats, special abilities, alignment, level, experience).
- [ ] Create mapping logic between psychological traits and RPG stats (e.g., Extraversion = Strength, Agreeableness = Wisdom).
- [ ] Implement status effect system with icons and modifier representations.
- [ ] Connect to `EventBus` for observing agent actions and publishing evaluation results.
- [ ] Create webhook or WebSocket endpoints for real-time evaluation updates to the frontend.
- [ ] Implement caching layer to avoid redundant evaluations for minor state changes.
- [ ] Design and generate pixel art assets for character portraits, stat icons, and status effects.
- [ ] Implement MMPI-2 clinical scale calculation for standardized psychological assessment.
- [ ] Create radar chart visualization component for MMPI-2 profile display with multi-agent comparison capability.
- [ ] Implement MBTI personality type assessment and dimension balance calculation.
- [ ] Build visual MBTI profile representation with preference strength indicators.
- [ ] Create data storage system for longitudinal personality development tracking.
- [ ] Design and implement comparative analysis tools for agent personality profiles.

## 17. Agent State Visualization [P2]

(See [Blueprint Section 3.5](docs/agent-architecture/03-instrumentation-features.md#3.5))
- [ ] Design and implement `StateBroadcastService` to emit agent state snapshots via WebSocket.
- [ ] Create state snapshot serialization and hydration with proper typing.
- [ ] Implement compression and differential updates to minimize network overhead.
- [ ] Design RPG-style character sheet UI components for frontend.
- [ ] Create pixel art assets for "equipment" representations of agent subsystems.
- [ ] Implement "inventory" visualization for memory items and facts.
- [ ] Build "active quest" representation of cognitive cycle steps.
- [ ] Create RPG quest log interface for browsing historical agent actions.
- [ ] Implement stat change tracking system with visual indicators (+/-).
- [ ] Design pixel art iconography for agent state changes and transitions.
- [ ] Integrate character sheet view with psychological profile display.
- [ ] Build "character progression" visualization showing agent development over time.

## 18. Inter-Agent Communication Analysis [P2]

(See [Blueprint Section 3.4](docs/agent-architecture/03-instrumentation-features.md#3.4))
- [ ] Create `agent/communication/communication-analysis.service.ts` for monitoring agent interactions.
- [ ] Design Zod schemas for relationship metrics and communication patterns in `packages/contracts/agent/communication.ts`.
- [ ] Implement relationship graph data structure to track inter-agent connections and attributes.
- [ ] Build communication metrics calculation system (response latency, depth, resonance, reciprocity).
- [ ] Develop algorithms for detecting interaction patterns (turn distribution, topic control, mirroring).
- [ ] Create visualization components for relationship mapping and communication dynamics.
- [ ] Implement conflict detection and relationship trend analysis.
- [ ] Build directional relationship quality assessment system based on message content analysis.
- [ ] Create endpoints for real-time relationship graph updates via WebSocket.
- [ ] Implement temporal analysis for tracking relationship evolution over time.
- [ ] Design database schema for storing relationship data and communication metrics.
- [ ] Build frontend integration for interactive relationship visualization.
- [ ] Create group cohesion analysis for scene-level social dynamics assessment.

## 19. Statistics Dashboard & Monitoring [P2]

(See [Blueprint Section 3.2](docs/agent-architecture/03-instrumentation-features.md#3.2))
- [ ] Create comprehensive dashboard UI for visualizing all collected metrics.
- [ ] Implement real-time chart components for agent performance and behavior visualization.
- [ ] Build timeline scrubber for historical data exploration and replay.
- [ ] Create drill-down views for detailed agent metrics investigation.
- [ ] Implement agent comparison tools for side-by-side metric analysis.
- [ ] Design alerting system for anomalous agent behavior or performance issues.
- [ ] Build export functionality for metrics data in standard formats (CSV, JSON).
- [ ] Implement configuration UI for adjusting collection parameters and thresholds.
- [ ] Create visualization components for system-level metrics (LLM latency, memory usage).
- [ ] Build heat map visualizations for mood trajectories and interaction intensities.
- [ ] Implement performance monitoring for all agent subsystems with threshold alerts.
- [ ] Create annotation functionality for marking significant events in metrics timeline.

## X. Reflection System [P2]

*(New Task Section)*
(See [Blueprint Section 2.9.1](docs/agent-architecture/02-core-subsystems.md#2.9.1))
- [X] Create `agent/reflection/` folder and core files (`reflection.interface.ts`, `reflection.service.ts`, `reflection.module.ts`).
- [P] Implement actual insight generation logic (LLM call) in `ReflectionService`. **(Placeholder implemented)**
- [P] Implement delegation logic to trigger updates in `SelfModelingService` and `OntologyService`. **(Placeholder implemented)**
- [P] Implement persistence for `ReflectionReport` (likely via `MemoryService`). **(Placeholder implemented)**
- [X] Integrate reflection trigger into `CognitiveCycleService` (e.g., on idle).

## Discovered During Work

- [X] Implement plan persistence in memory system (Added Feb 19, 2024)
- [X] Add `planContext` to relevant AgentAction schemas instead of generic metadata (Added Feb 20, 2024)
- [X] Add `AgentDynamicStateUpdatedEvent` for analysis tracking (Added Feb 20, 2024)
