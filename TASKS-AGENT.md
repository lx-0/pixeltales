# PixelTales Agentic Architecture Migration Tasks

## Priority Legend

- [P1] Critical: core systems and prerequisites for the agentic framework.
- [P2] Important: necessary modules that rely on P1 and improve core functionality.
- [P3] Optional/Polish: UX, documentation, and cleanup tasks after core features.

This file tracks the step-by-step tasks needed to transform the existing PixelTales codebase into the planned agent-centric architecture.

## 1. Project & Directory Structure [P1]

- [ ] Create `apps/backend/src/agent/` folder to house all agent-specific modules.
- [ ] Move or scaffold subfolders under `agent/`: `memory/`, `planner/`, `learning/`, `toolbelt/`, `orchestrator/` and core files (`agent.service.ts`, `agent.factory.ts`, `agent.module.ts`, `agent.state.ts`).
- [ ] Move Zod schemas for agent contracts to `packages/contracts/agent/` (including new `stats.ts`).
- [ ] Update `tsconfig.json` and import paths to reflect the new folder layout.

## 2. Contracts & Schemas [P1]

- [ ] Define and export agent stats schemas in `packages/contracts/agent/stats.ts`.
- [ ] Ensure `MetricSchema`, `AgentActionEventSchema`, `StepTimingEventSchema`, `MemoryEventSchema`, and `RewardEventSchema` are in place and imported by services.
- [ ] Add `IEventBus`, `IMemoryInterface`, `ILearningInterface`, `IPlannerService`, `IToolbelt`, `IRewardFunction`, and `IMetricsAdapter` interfaces under `packages/contracts/agent/`.

## 3. Memory System [P1]

- [ ] Implement `agent/memory/episodic-memory.service.ts` with `addObservation()` and `retrieveObservations()`.
- [ ] Implement `agent/memory/semantic-memory.service.ts` with `upsertFact()` and `retrieveFacts()`.
- [ ] Register `MemoryService` in `agent/memory/memory.module.ts` and wire it into the `agent.module.ts`.
- [ ] Integrate calls to `memoryInterface` in the orchestrator and agent workflow.

## 4. Planner (HTN) System [P2]

- [ ] Create `agent/planner/htn-planner.service.ts` implementing `IPlannerService.generatePlan()`.
- [ ] Scaffold `PlannerModule` and import in `agent.module.ts`.
- [ ] Hook planner into the Decide & Plan phase in `orchestrator.service.ts`.

## 5. Learning & Adaptation [P2]

- [ ] Build `agent/learning/learning.service.ts` implementing `ILearningInterface.recordReward()` and `getExperienceBatch()`.
- [ ] Schedule periodic policy updates and meta-learning routines.
- [ ] Connect reward recording to post-action in `orchestrator.service.ts` (Learn & Adapt step).

## 6. Toolbelt Services [P2]

- [ ] Implement `agent/toolbelt/toolbelt.service.ts` with `call(toolName, params)` dispatcher.
- [ ] Add specific tool classes: `datetime.tool.ts`, `memory.tool.ts`, `end-conversation.tool.ts`.
- [ ] Register all tools in `toolbelt.module.ts` and expose via `agent.module.ts`.

## 7. Orchestrator & Agent Lifecycle [P1]

- [ ] Refactor `ConversationOrchestratorService` into `agent/orchestrator/orchestrator.service.ts`, updating imports to use new interfaces.
- [ ] Implement `AgentService` and `AgentFactory` to spawn per-character logic (wrapping orchestrator calls).
- [ ] Move cognitive cycle coordination into `agent/orchestrator` and update calling code in `SceneManagerService`.

## 8. Event Bus & Stats Pipeline [P1]

- [ ] Create `core/event-bus.interface.ts` and `event-bus.service.ts` implementing `IEventBus` (publish/subscribe).
- [ ] Build `core/stats-collector.service.ts` listening on `agent.action`, `orchestrator.stepCompleted`, `memory.logged`, `learning.reward`.
- [ ] Implement `TimeSeriesAdapter` and `OLAPAdapter` in a new `core/adapters/` folder.
- [ ] Introduce `MetricFormatter` and concrete formatters under `core/formatters/`.
- [ ] Wire adapters and formatters into `StatsCollectorService` in `core/metrics.module.ts`.

## 9. Refactor Existing Services [P2]

- [ ] Update `SceneManagerService` and `ConversationStateService` to use `EventBusService` instead of direct event-emitter.
- [ ] Replace direct memory calls in `MessageGenerationService` with `MemoryService` adapters.
- [ ] Change LLM calls in `LlmService` to emit latency/error events via `CircuitBreakerService`.
- [ ] Update `MessagesDbService` to record metrics and pass events to `EventBusService`.

## 10. Frontend Integration [P3]

- [ ] Update frontend to consume new stats endpoints or streams for live dashboards.
- [ ] Refactor chart components to bind to typed stats models (using `MetricSchema`).
- [ ] Adjust UI to use new agent folder structure for any shared code or types.
- [ ] Ensure history-mode replay uses enriched event payloads for Agent actions, memory events, and rewards.

## 11. Testing & Validation [P1]

- [ ] Write unit tests for each new agent submodule (memory, planner, learning, toolbelt, orchestrator).
- [ ] Write integration tests for the EventBus → StatsCollector → Adapter pipeline.
- [ ] End-to-end tests simulating an agent conversation with metrics collection.

## 12. Documentation & Cleanup [P3]

- [ ] Update `README.md` with agentic architecture and new module descriptions.
- [ ] Finalize `docs/agent-architecture.md` to reference concrete file paths and class names.
- [ ] Remove any deprecated code or modules not needed in the agent-centric model.

*Date Added: {"2024-09-10"}

## 13. Database Schema Migration [P1]

**Note:** Because the app is still in development (not live), we can skip rolling migrations on production. Instead, adjust the **initial database schema migration file** (e.g., `migrations/0001_initial.sql` or equivalent) to include required new tables:

- `episodic_memory`
- `semantic_memory`
- `plan_nodes`
- `metrics`
- `rewards`
- Any additional columns for character state, memory, or stats.

## 14. Pre-Implementation Discussion [P1]

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

## 15. Psychological Evaluation System [P2]

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

## 16. Agent State Visualization [P2]

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

## 17. Inter-Agent Communication Analysis [P2]

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

## 18. Statistics Dashboard & Monitoring [P2]

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
