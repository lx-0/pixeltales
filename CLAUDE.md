# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

PixelTales — interactive pixel-art world where AI characters hold Socket.IO-driven conversations. Live demo at <https://pixeltales.0fo.de>. Latest commit is tagged "MVP" (`b91ae54`).

**Not a monorepo.** Two sibling apps at the repo root:

- `frontend/` — Vite + React 18 + TypeScript + Phaser 3 + Tailwind + shadcn/ui + Redux Toolkit + socket.io-client. Uses `npm`, not pnpm. Lockfile: `package-lock.json`.
- `backend/` — Python 3.11 + FastAPI + Poetry + LangChain (OpenAI + Anthropic) + python-socketio + SQLAlchemy async + SQLite (dev) / PostgreSQL (prod).

### Stale scaffolding — ignore

`apps/`, `packages/`, `.project/V1/project-summary.md` describe an abandoned V1 rewrite (NestJS + Turborepo + pnpm + Drizzle + LangChain.js). The root workspace `CLAUDE.md` at `/Users/alex/Sync/home/alex/Code/WebDev/CLAUDE.md` still says "pixeltales — Turborepo. AI character storytelling. NestJS, Drizzle, React" — that is wrong for the current MVP. Don't edit files under `apps/` or `packages/`, and don't trust V1 docs unless the user explicitly revives that track.

## Common commands

### Docker (recommended — matches prod)

```bash
cp .env.example .env.development   # add OPENAI_API_KEY (and optionally ANTHROPIC_API_KEY)
docker compose up                   # dev: frontend on :5173, backend on :8000
docker compose -f docker-compose.prod.yml up   # prod build: frontend on :80
```

Compose project names: `pixeltales-dev` / `pixeltales-prod`. Backend mounts `./data/sqlite` for SQLite persistence.

### Frontend (local, without Docker)

```bash
cd frontend
npm install
pnpm dev             # Vite dev server on :5173, HMR
pnpm build           # tsc -p tsconfig.app.json && vite build
pnpm typecheck       # tsc --noEmit only
pnpm lint            # biome check (errors + warnings fail)
pnpm lint:fix        # biome check --write
pnpm format          # biome format --write
pnpm preview         # preview production build
```

Path alias: `@/*` → `frontend/src/*`. Lint+format is Biome 2 (`biome.json`, no ESLint/Prettier).

### Backend (local, without Docker)

```bash
cd backend
uv sync
uv run alembic upgrade head                              # create/migrate DB schema
uv run uvicorn app.main:socket_app --reload --port 8000
uv run mypy app                                          # strict typing
uv run ruff check                                        # lint
uv run ruff format                                       # format
uv run alembic revision --autogenerate -m "..."          # new schema migration
```

`mypy` is configured `strict_optional = true` + `check_untyped_defs` + `pydantic.mypy` plugin. The ASGI entrypoint is `app.main:socket_app` (the Socket.IO wrapper), **not** `app.main:app` — using the wrong one drops all WebSocket routing.

## Architecture

**Canonical: 4-layer Agent / Harness / World / Client.** See [`docs/architecture.md`](docs/architecture.md) for the full model, dependency rules, naming conventions, and dependency graph.

### Runtime shape

Browser ⇄ Socket.IO ⇄ FastAPI backend ⇄ PydanticAI (OpenAI/Anthropic, optionally via LiteLLM gateway) + SQLAlchemy (SQLite/PG).

The game is not request/response — it's a server-driven loop. The Harness ticks conversations forward, mutates the World, the World fires events, the SocketIOClient broadcasts to every connected viewer.

### Backend layout

- `app/main.py` — builds FastAPI app + `socketio.AsyncServer`, instantiates `Harness` + `SocketIOClient(sio, harness.world, harness)`. Routers: `/api/v1/config`, `/api/v1/scenes`, `/api/v1/characters`. Health: `/health`. ASGI entrypoint: `app.main:socket_app`.
- `app/agent/llm.py` — `LLMManager` (Agent layer): one PydanticAI `Agent[None, CharacterResponse]` per unique `LLMConfig` hash. Structured output via tool-calling. Routes via LiteLLM gateway when `LITELLM_BASE_URL` is set, else direct OpenAI/Anthropic SDK.
- `app/agent/characters/<id>/` — character library SSOT: `AGENTS.md` (role) + `.character.yaml` (identity + placement + LLMConfig). Loader at `app/agent/characters/__init__.py`. Future `skills/<name>/SKILL.md` per agentskills.io spec (see ROADMAP).
- `app/harness/orchestrator.py` — `Harness` (Harness layer): owns the active scene's tick loop, visitor set, retry policy, and snapshot persistence. Composes `Conversation`, `SceneService`, `SceneConfigService`. Calls into `World` for state mutations.
- `app/harness/conversation.py` — turn-taking, speaking-time pacing (`base_speaking_time + char_speaking_time * len`), context window of 20, end-conversation request with 180s validity.
- `app/harness/scene_loader.py` + `scene_config_loader.py` — scene + proposal loading.
- `app/world/state.py` — `World` (World layer): wraps `Scene` with mutation API (`set_character_action`, `add_message`, `set_visitor_count`, …). Every mutation fires a `WorldEvent`. Subscribers register via `world.subscribe(callback)`.
- `app/world/events.py` — typed `WorldEvent` dataclasses (`CharacterActionChanged`, `CharacterMessageAdded`, `VisitorCountChanged`, …).
- `app/world/persistence/snapshots.py` — `SceneStateSnapshotService`: per-scene retention + SQLite persistence.
- `app/client/socketio.py` — `SocketIOClient` (Client layer): subscribes to World events, broadcasts `scene_state` to all viewers via Socket.IO. Owns `connect`/`disconnect` handlers; routes `add_visitor`/`remove_visitor` to the Harness.
- `app/db/` — SQLAlchemy async models. Two tables: `scene_configs` (JSON blob of a scene config) and `scene_state_snapshots` (time-series of scene state, FK to config).
- `app/default_scene.py` — seeded default scene composition (uses character library).
- `app/core/config.py` — Pydantic Settings. `DB_TYPE=sqlite|postgresql`, `database_url` computed property, CORS origins auto-derive from `FRONTEND_PORT` + `ENV` when `BACKEND_CORS_ORIGINS` is empty.

### Frontend: React shell + Phaser game

- `src/App.tsx` — creates the Phaser `Game` once (ref-guarded), connects `socketService` once (ref-guarded), subscribes to `scene_state` and feeds it to `SceneInfo`, `ConversationHistory`, etc. Two HUD modes via `useViewMode`.
- `src/game/config.ts` + `MainScene.ts` + `UIScene.ts` — Phaser scene graph.
- `src/game/managers/` — per-concern managers (Character, Connection, Event, History, SpeechBubble, State, UIControls). Each subscribes to socket events and mutates Phaser objects. The longest (`UIControlsManager`, 512 lines) is at the cursorrules 500-line soft limit — prefer splitting over extending.
- `src/services/socket.ts` — singleton wrapper around `socket.io-client` with typed add/removeListener.
- React Query is installed and provider-mounted, but the source of truth for live scene data is socket events, not HTTP. Use React Query for the REST endpoints (`/api/v1/config`, `/api/v1/scenes`).
- UI primitives are shadcn/ui under `src/components/ui/`. `components.json` is configured; use `npx shadcn@latest add <component>` to add more.

### Env & ports

`.env.development` (dev) and `.env.production` (prod) are committed-as-example via `.env.example`. Required: `OPENAI_API_KEY`. Optional: `ANTHROPIC_API_KEY`, `DB_TYPE`, `POSTGRES_*`. `FRONTEND_PORT` defaults to 5173 dev / 80 prod; `BACKEND_PORT` 8000. The Vite client reads `VITE_BACKEND_URL` (injected by compose).

## Conventions worth knowing

- **Lint+format is Biome 2** (`biome.json`) frontend, **ruff** backend. Both wired into `lefthook` pre-commit. No ESLint/Prettier — don't reach for them.
- **Test suite exists.** Backend: `uv run pytest` (38 tests, 62.92% coverage, floor 55%). Frontend: `pnpm test` (vitest, 20 tests, floor 15/9/8/15). E2E: `pnpm test:e2e` (Playwright). Browser smoke: `pnpm diag` (headless playwright via `frontend/scripts/diag.mjs`).
- **German-language scene content is expected** in `default_scene.py` and some LLM prompts. Don't "translate to English" as a drive-by.
- **`.cursorrules` is active and overrides generic advice** — key points: no file >500 LOC, don't read/edit `.env*`, never use service_role Supabase keys, keep `README.md` user-focused.
- **SQLite path gotcha.** Dev container mounts `./data/sqlite` to `/data/sqlite`; `SQLITE_URL` uses `sqlite+aiosqlite:////data/sqlite/pixeltales.db` (four slashes — absolute path inside container). Running the backend bare-metal without `SQLITE_URL` override writes to `data/sqlite/pixeltales.db` relative to CWD.
- **Naming discipline (architecture):** layer names `agent`/`harness`/`world`/`client` are reserved for their respective layers (see `docs/architecture.md`). Avoid generic `manager`/`service`/`handler` — pick the layer's vocabulary instead. "Gateway" is reserved for the **LLM gateway** (LiteLLM); don't reuse for Client adapters.
