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
npm run dev          # Vite dev server on :5173, HMR
npm run build        # tsc -p tsconfig.app.json && vite build
npm run typecheck    # tsc --noEmit only
npm run lint         # eslint with --max-warnings 0
npm run preview      # preview production build
```

Path alias: `@/*` → `frontend/src/*`. Lint config is `eslint.config.js` (flat config, ESLint 9).

### Backend (local, without Docker)

```bash
cd backend
poetry install
poetry run python -m app.db.init_db                      # create SQLite schema
poetry run uvicorn app.main:socket_app --reload --port 8000
poetry run mypy app                                       # strict typing
```

`mypy` is configured `strict_optional = true` + `check_untyped_defs` + `pydantic.mypy` plugin. The ASGI entrypoint is `app.main:socket_app` (the Socket.IO wrapper), **not** `app.main:app` — using the wrong one drops all WebSocket routing.

## Architecture

### Runtime shape

Browser ⇄ Socket.IO ⇄ FastAPI backend ⇄ LangChain (OpenAI/Anthropic) + SQLAlchemy (SQLite/PG).

The game is not request/response — it's a server-driven loop. The backend holds scene state in memory, ticks conversations forward, calls LLMs, and broadcasts `scene_state` events to every connected client. The frontend is largely a thin renderer of whatever the server pushes.

### Backend: scene → conversation → LLM

- `app/main.py` — builds FastAPI app, wraps it in `socketio.ASGIApp` as `socket_app`, wires `connect`/`disconnect` to `SceneManager.add_visitor`/`remove_visitor`. Routers: `/api/v1/config`, `/api/v1/scenes`. Health: `/health`.
- `app/services/scene_manager.py` (the orchestrator, ~360 lines) — owns the active `Scene`, visitor set, tick loop, and broadcast. Composes `SceneConfigService`, `SceneService`, `SceneStateSnapshotService`, `ConversationManager`, `LLMManager`.
- `app/services/conversation_manager.py` — turn-taking, speaking-time pacing (`base_speaking_time + char_speaking_time * len`), context window of 20, end-conversation request with 180s validity.
- `app/services/llm_manager.py` — LangChain `ChatOpenAI` / `ChatAnthropic` behind a single interface. Character replies are parsed via `PydanticOutputParser` into a `CharacterResponse` schema (mood, mood_emoji, thoughts, content, reaction emoji, conversation_rating, end_conversation, recipient). Prompt templating lives here.
- `app/db/` — SQLAlchemy async models. Two tables: `scene_configs` (JSON blob of a scene config) and `scene_state_snapshots` (time-series of scene state, FK to config).
- `app/default_scene.py` / `default_scene.branding.py` — seeded scene definitions.
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

- **Frontend formatter is Prettier** (`.prettierrc`, 2-space, single quotes), lint is ESLint 9 flat config. Backend format/lint is not pinned — stick with `mypy` for type safety.
- **German-language scene content is expected** in `default_scene*.py` and some LLM prompts. Don't "translate to English" as a drive-by.
- **`.cursorrules` is active and overrides generic advice** — key points: no file >500 LOC, don't read/edit `.env*`, never use service_role Supabase keys, keep `README.md` user-focused.
- **No test suite.** No `pytest`, no `vitest`, no Playwright configured. Don't fabricate a `npm test` command — there isn't one.
- **SQLite path gotcha.** Dev container mounts `./data/sqlite` to `/data/sqlite`; `SQLITE_URL` uses `sqlite+aiosqlite:////data/sqlite/pixeltales.db` (four slashes — absolute path inside container). Running the backend bare-metal without `SQLITE_URL` override writes to `data/sqlite/pixeltales.db` relative to CWD.
