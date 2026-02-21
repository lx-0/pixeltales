# PixelTales Architecture Reference

## Agent Subsystem Details

### Perception System (Section 2.2)

Translates raw environment events into typed `AgentPerceptionEvent`s.

**Extensions:**
- `VisualPerceptionExtension` — processes visual data (proximity, visibility checks)
- `AuditoryPerceptionExtension` — processes audio/speech events (distance filtering)

**Event Types:**
- `MessageBroadcastEvent`: `{ type: 'message', visualId, content, timestamp }`
- `AgentEnteredEvent`: `{ type: 'enter', visualId, visualDescription, timestamp }`
- `AgentLeftEvent`: `{ type: 'leave', visualId, timestamp }`
- `SceneUpdateEvent`: `{ type: 'scene_update', description, timestamp }`

**Key principle:** Agents perceive others only via temporary `visualId` — identity must be inferred.

### Cognitive Cycle Service (Section 2.3)

Located at: `apps/backend/src/agent/cognitive-cycle/cognitive-cycle.service.ts`

Implements the enhanced OODA loop with dual-process cognition:

**Orient phase builds `OrientationContextSchema`:**
- DynamicState (mood, interest, focus)
- Last N conversation messages
- Relevant episodic + semantic memories
- Active short-term goals
- Uncertainty metrics + information gaps
- Active hypotheses
- Self-concept relevance

**Decide/Plan phase:**
- Cognitive Effort Allocator selects System-1 vs System-2
- Utility function ranks goals (urgency, novelty, sentiment)
- `CuriosityService.getIntrinsicMotivation()` influences ranking
- Complex goals → HTN planning via `PlannerService.generatePlan()`
- Plans stored in episodic memory

### Planner/Executor (Section 2.1.4)

Uses **Hierarchical Task Networks (HTN)**:
- Goals decompose into tree of `PlanNode` objects
- Schema: `{ id, parentId?, description, status, toolCall? }`
- Executes leaf nodes incrementally across cognitive cycles
- Parent auto-completes when all children done
- Plans persisted in memory for traceability

### Memory Interface Methods

```typescript
// Episodic
addObservation(timestamp, content, associatedVisualIds)
retrieveObservations(query, timeFilter, visualIdFilter) → Observation[]

// Semantic
upsertFact(subjectVisualId, key, value, confidence)
retrieveFacts(subjectVisualId, query) → Fact[]
upsertConcept(conceptId, properties, relations, confidence)
retrieveConcepts(query, filter) → Concept[]
updateOntology(conceptId, updates)

// Self
getSelfConcept() → SelfConcept
updateSelfConcept(property, value, confidence)
queryCapabilities(task)
getAgencyBoundaries()
```

### Dynamic State Fields

| Field | Mutated By | Notes |
|-------|-----------|-------|
| `mood` | Agent + System-1 | Updated after each turn |
| `participationInterest` | Agent | From mood + context relevance |
| `currentFocus` | Agent | Cleared on focus change |
| `shortTermGoals` | Agent + Planner | Planner may push/pop |
| `curiosityLevel` | Agent + CuriositySystem | Based on new observations |
| `uncertaintyMetrics` | Agent + OntologySystem | Confidence tracking |
| `selfConcept` | Agent + SelfModelingSystem | Evolves via self-discovery |

### Reflection System (Section 2.9.1)

Triggers after N conversation turns, on idle, or when curiosity thresholds exceed values.

Produces `ReflectionReportSchema`:
- Summary of recent events
- Insights (self, world, social, goal) with confidence scores
- Updated self-concept properties
- Updated ontology relations
- Mood adjustments

### Curiosity System (Section 2.9.2)

Drives intrinsic motivation:
- Information gap detection
- Hypothesis generation
- Experimental design
- Information gain computation feeds into reward

### Learning System (Section 2.8)

- `RewardFunction.compute(conversationRating, goalProgress, userFeedback)`
- Records `(stateSnapshot, agentAction, rewardScore)` tuples
- Periodic policy updates, meta-learning, memory pruning
- Information gain from exploration incorporated into reward

### Event Bus (Section 3.1)

Central `EventBusService` in `apps/backend/src/core/`:
- Pub/Sub with hierarchical namespaces
- Key event domains: `agent.cognitive.cycle.*`, `agent.state.dynamic.*`, `agent.action.*`, `simulation.*`, `perception.*`
- `DomainEvent` union type defined in contracts
- Static `createEvent()` helper on EventBusService

### Stats Pipeline (Section 3.2)

`StatsCollectorService` → `IMetricFormatter` → `IMetricsAdapter`

- Formatters: `DefaultMetricFormatter` (handles action, timing, reward, state events)
- Adapters: `TimeSeriesAdapter`, `OLAPAdapter` (both write to SQLite `metrics` table)
- Subscribes to dynamic state and cycle phase events

### External Analysis Systems (NOT part of agent cognition)

These analyze agent behavior externally — agents are unaware:
- **Psychological Evaluation (3.3):** MMPI-2, MBTI, RPG-style character profiles
- **Communication Analysis (3.4):** Relationship mapping, interaction patterns, group cohesion
- **Agent State Visualization (3.5):** RPG character sheet, quest log interface
- **Learning Notifications (3.6):** Gamified XP notifications for learning events

### Performance Classification

| Subsystem | LLM Dependency |
|-----------|---------------|
| Perception | Low (mostly data processing) |
| System-1 | Medium (minimal context LLM) |
| System-2 | High (large context, complex reasoning) |
| Planner/HTN | High (sophisticated reasoning) |
| Action System | Low (data processing) |
| Working Memory | None |
| Episodic Memory | Low (LLM only for summarization) |
| Semantic Memory | Medium (relevance + extraction) |
| Ontology | Medium |
| Curiosity | High |
| Self-Modeling | High |
| Event Bus | None |
| Stats Collector | None |

### Integration Patterns

- **Facade Pattern:** MemoryService wraps episodic, semantic, self-model
- **Mediator Pattern:** CognitiveCycleService coordinates subsystems
- **Adapter Pattern:** MetricsAdapters abstract storage backends
- **Circuit Breaker:** CircuitBreakerService wraps LLM calls

## Database

**ORM:** Drizzle  
**Current DB:** SQLite (file-based, dev)  
**Migrations:** `apps/backend/src/db/migrations/`

Key migration files:
- `0000_initial_schema.ts` — base tables
- `0001_pixeltales_v1.ts` — V1 scene/conversation tables
- `0002_pixeltales_agents.ts` — agent memory, plans, metrics, rewards, hypotheses tables

Tables include: `episodic_memory`, `semantic_memory` (facts, concepts, relations), `plans`, `plan_nodes`, `metrics`, `rewards`, `hypotheses`, `experiments`, `agent_self_models`

## Frontend Architecture

**Game Engine:** Phaser 3 rendered within React shell

**Current MVP (Frankenstein):**
- `FrankensteinScene` — Phaser game scene
- `FrankensteinUIScene` — Phaser UI overlay
- `AgentManager`, `NpcManager`, `EntityManager` — game entity management
- `ConnectionManager` — WebSocket connection handling

**V1 (Legacy):**
- `MainScene` + `UIScene` — original Phaser scenes
- Managers: Character, SpeechBubble, History, State, EventManager, UIControls

**Shared:**
- `socket.ts` — Socket.IO service (debug connection for MVP)
- React components in `src/components/` (e.g., CharacterGenerationDialog)
- shadcn/ui components via `packages/shadcn-ui/`

## WebSocket Communication

- Backend: NestJS Gateways (`events/`, `debug/`)
- Frontend: Socket.IO client
- Debug events streamed to `FrankensteinUIScene` for agent mind visualization
- All game state changes flow backend → frontend (observer pattern)
