# Architecture

PixelTales is built as a **4-layer agentic system**: Agent / Harness / World / Client. This document is the canonical reference — all future code, naming, and refactoring align to it.

## The Four Layers

### Agent — *the NPC brain*

The LLM-driven reasoning entity. One Agent per character. An Agent has:
- **Identity** — `AGENTS.md` (the agents.md spec): role, personality, traits
- **Capabilities** — `SKILL.md` folders (the agentskills.io spec): callable tools the Agent can invoke
- **Configuration** — `.character.yaml`: model, tier, sprite, default placement

An Agent knows nothing about how it's invoked, where its perception comes from, or where its actions go. Channel-agnostic, scene-agnostic, harness-agnostic.

**Implementation today:** PydanticAI `Agent` per `LLMConfig` hash, `CharacterResponse` schema.

### Harness — *the orchestrator*

Owns the agentic loop. Drives turn-taking, paces character output, persists snapshots, retries on transient errors, applies fallbacks on sustained errors. Reads from World to build perception; writes Agent's output back to World. Channel-agnostic — does not know that Phaser exists.

**Implementation today:** mostly `SceneManager` + `ConversationManager` (currently mixed with World mutations and Client emit — see refactor below).

### World — *the simulated environment*

Server-authoritative state of the scene: positions, characters, time, props, event log, conversation messages. Mutated by Harness, queried by Agents (via Harness for perception), broadcast by Clients (via subscribed events).

The World fires **domain events** (`character_started_speaking`, `visitor_joined`, `scene_ended`); subscribers handle them. The World does not know who's watching.

**Implementation today:** `SceneState` + `Scene` Pydantic models, `scene_state_snapshot_service` for persistence. World mutations live inline in `SceneManager` (target: extract).

### Client — *the I/O adapter*

Translates between the World and the outside world. Subscribes to World events, broadcasts them to viewers; receives input from viewers, forwards it to Harness. Multiple Clients can serve the same World simultaneously.

Today there is one Client (Socket.IO bridge to the Phaser game). Tomorrow there can be many: REST polling, Twitch viewer-stream, Discord bot, mobile app.

**Implementation today:** Socket.IO server in `app/main.py` + scattered emits inside `SceneManager` (target: extract into `app/client/socketio.py`).

## Why this split

Each layer stabilizes a different rate of change:

| Layer | Stability | Changes when… |
|-------|-----------|---------------|
| Agent | High | New character archetypes; new Agent capabilities (skills) |
| Harness | Medium | Turn-taking rules, retry policy, multi-NPC orchestration |
| World | Low (data) / Medium (rules) | Adding spatial reasoning, props, time, weather |
| Client | High | New surface (Twitch, Discord, mobile); wire-format tweaks |

The current code mixes Harness + World + Client in `SceneManager`. Every Client addition (Twitch) or World extension (props, spatial queries) requires touching the same file. The 4-layer split gives each concern its own home.

## Dependency Rules

Imports flow one direction:

```
Client  →  Harness  →  Agent
   ↘         ↓
    →     World
```

Allowed:
- `Client → Harness` (forward visitor input)
- `Client → World` (read state, subscribe to events)
- `Harness → Agent` (invoke for next turn)
- `Harness → World` (read for perception, write for action)

Forbidden:
- `Agent → Harness` — Agent must be invocation-agnostic
- `Agent → World` — Agent receives perception; does not query World directly
- `World → Harness` — World fires events; Harness subscribes
- `World → Client` — World does not know who's watching

Cross-cutting (`app/core/`, `app/db/`, `app/models/`, `app/utils/`) may be imported by any layer.

## Naming Conventions

**Layer names are reserved**: `agent`, `harness`, `world`, `client`. Use as directory and module prefixes. Do not use them for unrelated concepts.

**Classes:**
- `Agent` — per character, PydanticAI-backed
- `Harness` — per scene, owns the agentic loop (replaces `SceneManager`)
- `World` — per scene, holds + mutates state, fires events
- `*Client` suffix per implementation — `SocketIOClient`, `TwitchClient`, `RESTClient`

**Files / dirs:** `app/<layer>/<concern>.py`. Tests follow: `tests/<layer>/test_<concern>.py`.

**Avoid these generic names:**
- `manager` — too vague; pick the layer's vocabulary instead (`Harness`, `World`)
- `service` — same problem
- `handler` — legacy term; if it's I/O it's a Client adapter, if it's orchestration it's Harness
- `gateway` — reserved in this project for the **LLM gateway** (LiteLLM). Do not reuse for the Client layer.

## Current → Target Mapping

| Today | Layer | Target |
|---|---|---|
| `app/services/llm_manager.py` | Agent | `app/agent/llm.py` |
| `app/characters/<id>/{AGENTS.md,.character.yaml}` | Agent | `app/agent/characters/<id>/{AGENTS.md,.character.yaml}` (+ future `skills/<name>/SKILL.md`) |
| `app/services/scene_manager.py` | Harness | `app/harness/orchestrator.py` (class: `Harness`) |
| `app/services/conversation_manager.py` | Harness | `app/harness/conversation.py` |
| `app/services/scene_service.py` | Harness | `app/harness/lifecycle.py` (scene loading) |
| `app/services/scene_config_service.py` | Harness | `app/harness/lifecycle.py` (proposal handling) |
| `app/models/scene.py` (state portion) | World | `app/world/state.py` (class: `World`) |
| `app/services/scene_state_snapshot_service.py` | World | `app/world/persistence/snapshots.py` |
| Socket.IO emit inline in `SceneManager` + bridge in `main.py` | Client | `app/client/socketio.py` (class: `SocketIOClient`) |
| `app/api/v1/...` FastAPI routers | Client (REST) | stays at `app/api/` (already a clean Client surface) |
| `app/core/`, `app/db/`, `app/models/` (non-scene), `app/utils/`, `app/prompts/` | Cross-cutting | stays |

## Refactor Phases

5 phases, each its own commit. Behavior-preserving — 38 backend tests + browser smoke (`pnpm diag`) as guard rails throughout.

**Phase A — Docs (this commit)**
- This file: canonical 4-layer reference + naming rules
- ROADMAP entries reframed with layer labels
- Root `CLAUDE.md` Architecture section updated to point here

**Phase B — Extract World layer**
- Create `app/world/` package
- Define `World` class wrapping scene state with mutation API (`set_character_action`, `add_message`, `record_visitor_join`, ...)
- Add `WorldEvent` dataclasses in `world/events.py`; `World` fires events on every mutation
- Move `scene_state_snapshot_service` → `world/persistence/snapshots.py`
- `SceneManager` calls `World.*` instead of mutating state inline
- Tests green; no class renames yet (containment of risk)

**Phase C — Rename Harness layer**
- Move `services/scene_manager.py` → `harness/orchestrator.py`; rename class `SceneManager` → `Harness`
- Move `services/conversation_manager.py` → `harness/conversation.py`
- Move `services/scene_service.py` + `scene_config_service.py` → `harness/lifecycle.py`
- Update FastAPI deps + `main.py` imports
- Tests green

**Phase D — Extract Client layer**
- Create `app/client/socketio.py` with `SocketIOClient` class
- Subscribe to World events fired in Phase B; emit `scene_state` to all viewers
- Remove direct `self.sio.emit(...)` calls from `Harness` (was `SceneManager`)
- Tests green; browser smoke green

**Phase E — Rename Agent layer**
- Move `services/llm_manager.py` → `agent/llm.py`
- Move `app/characters/` → `app/agent/characters/`
- Update imports
- Tests green

Estimated total surface: ~30-40 files touched across all phases. Done one phase per commit.

## System Diagram

```mermaid
graph TB
  subgraph Client_Layer[Client layer]
    SocketIO[SocketIOClient<br/>Phaser bridge]
    REST[REST endpoints<br/>app/api/]
    Future[future: Twitch/Discord/Mobile]
  end

  subgraph Harness_Layer[Harness layer]
    H[Harness<br/>turn loop, retry, lifecycle]
    Conv[Conversation<br/>prompt + history prep]
  end

  subgraph Agent_Layer[Agent layer]
    A1[Agent: alice<br/>PydanticAI + AGENTS.md]
    A2[Agent: bob<br/>PydanticAI + AGENTS.md]
  end

  subgraph World_Layer[World layer]
    W[World<br/>state + mutations + events]
    Snap[Snapshots<br/>SQLite persistence]
  end

  SocketIO --> H
  SocketIO --> W
  REST --> H
  REST --> W
  H --> A1
  H --> A2
  H --> W
  W --> Snap
  W -. events .-> SocketIO
  W -. events .-> REST
```

## Tech Stack (current)

**Backend:** FastAPI 0.118+, Python 3.12, PydanticAI 1.86 (LLM layer), SQLAlchemy async + SQLite/PostgreSQL, Socket.IO server (`python-socketio`), structlog, slowapi (rate-limit), Prometheus instrumentator. Package manager: `uv`. Lint: ruff. Types: mypy strict.

**Frontend:** React 19 + Vite + TypeScript, Phaser 3.90 (Game Engine), Tailwind 4 + shadcn/ui, Redux-free (`useState` + React Query), Socket.IO client. Package manager: `pnpm`. Lint+format: Biome.

**Cross-stack:** OpenAPI codegen (`openapi-typescript` + `openapi-fetch`) for typed REST contracts; per-Socket-event typed schemas via `socket-events.ts` mapping generated Pydantic schemas to `ServerToClientEvents`/`ClientToServerEvents`.

**LLM routing:** LiteLLM gateway at `llm.yester.cloud` when `LITELLM_BASE_URL` is set; falls back to direct OpenAI/Anthropic SDK calls otherwise. **Note: "gateway" is reserved for this LLM-routing layer** — don't reuse the term for the Client layer.

## Cross-Cutting Concerns

**Security:** CORS tightened (Phase 3a); slowapi rate limits (100/min global, 5/min on `/scenes/propose`, 30/min on `/vote`); Pydantic `extra="forbid"` on write boundaries.

**Observability:** Prometheus metrics at `/metrics` (`pixeltales_visitors_active`, `pixeltales_messages_total{character}`, `pixeltales_llm_response_seconds{provider,model}`). OpenTelemetry traces planned (waiting on collector). Grafana board planned (see ROADMAP).

**Persistence:** Alembic migrations as schema source-of-truth. Two tables: `scene_configs` (proposal storage) + `scene_state_snapshots` (time-series with per-scene retention configurable via `SCENE_SNAPSHOT_RETENTION`, default 10).
