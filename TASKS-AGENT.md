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
