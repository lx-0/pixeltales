---
name: pixeltales
description: Comprehensive project knowledge for PixelTales - an AI multi-agent emergent storytelling platform with pixel art RPG visualization. Use when working on any PixelTales code, understanding the agent architecture, navigating the monorepo, or implementing features related to agents, memory, cognition, frontend scenes, or contracts.
---

# PixelTales Project Skill

## Project Overview

PixelTales is an experimental platform for **emergent storytelling** through autonomous AI agents in a pixel art RPG world. Users **observe** (not play) autonomous agents that perceive, remember, plan, and interact in real-time unscripted conversations.

- **Author:** Alex (yesterday AI, <alex@yesterday-ai.de>)
- **URL:** https://pixeltales.yesterday-ai.de
- **Repo:** https://github.com/lx-0/pixeltales.git

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | Turborepo + pnpm workspaces |
| Backend | NestJS (TypeScript, strict mode) |
| Frontend | React + Phaser 3 (game engine) + Tailwind CSS + shadcn/ui |
| AI/LLM | LangChain.js, targeting `gpt-4o` |
| Data Contracts | Zod schemas in `packages/contracts` |
| Database | SQLite via Drizzle ORM (dev), PostgreSQL planned |
| Real-time | WebSockets (NestJS Gateway + Socket.IO) |
| Package Manager | pnpm@9.13.0 |

## Monorepo Structure

```
pixeltales/
├── apps/
│   ├── backend/src/              # NestJS application
│   │   ├── agent/                # Core agent architecture (THE KEY MODULE)
│   │   │   ├── cognitive-cycle/  # OODA loop (Observe→Orient→Decide→Act→Learn)
│   │   │   ├── memory/           # Episodic, Semantic, Working memory
│   │   │   ├── planner/          # HTN (Hierarchical Task Network) planning
│   │   │   ├── learning/         # Reward functions, policy updates
│   │   │   ├── ontology/         # Structured world knowledge
│   │   │   ├── curiosity/        # Intrinsic motivation & exploration
│   │   │   ├── self-modeling/    # Agent self-awareness
│   │   │   ├── reflection/       # Experience synthesis
│   │   │   ├── extensions/       # Capability & perception extensions
│   │   │   ├── internal-tools/   # Memory/datetime/ontology tools
│   │   │   ├── action/           # Action formatting & dispatch
│   │   │   └── llm/              # Agent-specific LLM service
│   │   ├── core/                 # EventBus, Stats, Config, Notifications, Resilience
│   │   ├── simulation/           # Environment simulation layer
│   │   ├── debug/                # Debug WebSocket gateway
│   │   ├── db/                   # Drizzle ORM, migrations
│   │   ├── v1/                   # Legacy V1 code (scene, conversation, characters)
│   │   └── events/               # WebSocket events gateway
│   └── frontend/src/
│       ├── game/
│       │   └── mvp-frankenstein/  # Current MVP: FrankensteinScene/UIScene
│       ├── v1/game/              # Legacy V1 Phaser scenes
│       ├── components/           # React components (character-generator, etc.)
│       ├── services/             # Socket services
│       └── lib/                  # API clients, utils
├── packages/
│   ├── contracts/src/            # Shared Zod schemas (THE SOURCE OF TRUTH)
│   │   ├── agent/                # Agent-specific schemas
│   │   │   ├── AgentAction.ts
│   │   │   ├── AgentState.ts
│   │   │   ├── AgentPerceptionEvent.ts
│   │   │   ├── MemorySchemas.ts
│   │   │   ├── PlanNode.ts / PlanSchemas.ts
│   │   │   ├── DomainEvents.ts / AgentInternalEvents.ts
│   │   │   ├── SimulationEvents.ts / SensoryEvents.ts
│   │   │   ├── LearningSchemas.ts / LearningNotification.ts
│   │   │   ├── ReflectionSchemas.ts / DiscoverySchemas.ts
│   │   │   ├── Metrics.ts
│   │   │   └── ExternalAnalysisSchemas.ts
│   │   └── v1/                   # Legacy V1 schemas (scene, character)
│   ├── auth/                     # Auth package (frontend + contracts)
│   ├── llm/                      # LLM package (backend + contracts + shared)
│   ├── llm-forms/                # LLM-powered form components
│   ├── shadcn-ui/                # Shared shadcn/ui components
│   └── user/                     # User package (contracts)
└── docs/                         # Architecture documentation
```

## Commands

```bash
pnpm install                    # Install all dependencies
pnpm dev                        # Run frontend + backend in parallel
pnpm dev:frontend               # Run frontend only
pnpm dev:backend                # Run backend only
pnpm build                      # Build all
pnpm build:packages             # Build shared packages first
pnpm clean                      # Clean all + remove root node_modules
pnpm lint                       # Lint all
```

## Agent Architecture (Core Concept)

The agent system is based on **Kahneman's Dual-Process Theory** ("Thinking, Fast and Slow"):

- **System-1 (Fast):** Lightweight LLM calls for intuitive reactions (minimal context)
- **System-2 (Slow):** Deep deliberative reasoning (full context, complex prompts)
- **Cognitive Effort Allocator** decides which system to engage

### Cognitive Cycle (OODA Loop)

```
Perception → Observe → Orient → Decide/Plan → Act → Learn
```

1. **Observe:** Filter perception events, update working memory
2. **Orient:** Retrieve memories, consult ontology + self-model, build context
3. **Decide/Plan:** System-1 or System-2 + HTN planning for complex goals
4. **Act:** Execute via capability extensions (speech, motion, tools)
5. **Learn:** Compute reward, record experience, trigger adaptation

### Memory System

| Type | Purpose | Persistence |
|------|---------|-------------|
| Working Memory | Current cycle scratch space | Volatile |
| Episodic Memory | Chronological experience log | SQLite/Drizzle |
| Semantic Memory | Facts, beliefs, knowledge | SQLite/Drizzle |
| Social Memory | Models of other agents | Implicit in Semantic+Episodic |
| Self Model | Self-awareness, capabilities | SQLite/Drizzle |

### Key Interfaces (Injection Tokens)

All major subsystems use NestJS dependency injection with interfaces:

- `MEMORY_INTERFACE` → `IMemoryInterface` (memory.interface.ts)
- `PLANNER_SERVICE` → `IPlannerService` (planner.interface.ts)
- `LEARNING_INTERFACE` → `ILearningInterface` (learning.interface.ts)
- `ACTION_SERVICE` → `IActionService` (action.interface.ts)
- `INTERNAL_TOOLS_INTERFACE` → `IInternalToolsInterface`
- `AGENT_LLM_SERVICE` → `IAgentLlmService`
- `ONTOLOGY_INTERFACE` → `IOntologyInterface`
- `SELF_MODELING_INTERFACE` → `ISelfModelingInterface`

### Event-Driven Communication

The `EventBusService` (in `core/`) is the central nervous system:
- Pub/Sub pattern with hierarchical namespaces
- Key event domains: `agent.*`, `simulation.*`, `perception.*`, `stats.*`
- Events defined in `packages/contracts/src/agent/DomainEvents.ts`

### Agent Loop Strategy (Hybrid)

- **Event-driven:** Perceptions trigger immediate cognitive cycles
- **Periodic tick:** Background loop (15-30s) for reflection and idle processing
- **Processing lock** prevents concurrent cycle execution per agent

## Current Development State

**Branch:** `agentic-architecture`

**MVP "Frankenstein"** (current target): Single agent running the full cognitive loop with basic observability. Frontend has `FrankensteinScene` + `FrankensteinUIScene` for debug visualization.

**What's working:** Core cognitive cycle, memory persistence (Drizzle), HTN planning, event bus, stats pipeline, basic perception extensions, reflection trigger.

**What's pending:** Full learning algorithms, notification dispatch, frontend integration, psychological evaluation, communication analysis, comprehensive testing.

For detailed task status, see `TASKS.md`.

## Key Patterns & Conventions

1. **Strict Zod contracts** in `packages/contracts` — always define schemas there first
2. **NestJS modules** with DI tokens for all services — follow existing pattern
3. **Event Bus** for cross-module communication — never direct module coupling
4. **AgentRuntimeState** holds live agent state (see `agent.state.ts`)
5. **Capability Extensions** for environment interaction (speech, motion, perception)
6. **Internal Tools** wrap cognitive functions for use in LLM tool calls
7. Agents perceive others only via `visualId` — never expose internal `agentId`
8. Frontend is **observer only** — all game logic runs on backend
9. Database migrations in `apps/backend/src/db/migrations/`
10. V1 code lives under `v1/` directories — new agent code in `agent/`

## Architecture Details

For detailed architecture reference including all subsystem specs, see [architecture-reference.md](architecture-reference.md).
For coding conventions and file patterns, see [conventions.md](conventions.md).
