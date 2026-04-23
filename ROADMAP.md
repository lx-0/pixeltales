# PixelTales Modernization Roadmap

Baseline: MVP commit `b91ae54` (April 2025). Python 3.11 + FastAPI + Poetry + LangChain, React 18 + Vite + Phaser 3 + npm, Node 18 in Dockerfile. No tests, no CI, Redux installed but unused.

Target: Workspace-standard stack (pnpm, Biome, uv, Node 22, Python 3.12), typed cross-stack contracts, LangGraph-based multi-agent orchestration, test coverage, deployable via GitHub Actions.

## Phase 0 — Dead code cleanup

Scope: purge V1 scaffolding, fix stale workspace-root references, drop unused dependencies.

- [ ] `apps/` (untracked, V1 NestJS/Turborepo leftover) — **user confirmation required**
- [ ] `packages/` (untracked, V1 shared packages leftover) — **user confirmation required**
- [ ] `.project/V1/project-summary.md` (gitignored, describes abandoned NestJS rewrite) — **user confirmation required**
- [ ] `.archive/legacy/` — review and decide (tag `legacy-v0` or drop)
- [ ] `supabase-backup/` untracked directory — clarify origin and destination
- [ ] Workspace-root `CLAUDE.md` pixeltales entry — correct from "Turborepo. NestJS, Drizzle, React" to actual stack (**out of project scope, user confirmation required**)
- [ ] `frontend/package.json` — drop `@reduxjs/toolkit`, `react-redux`, `@types/react-redux`, `@shadcn/ui` (0.0.4 — wrong package, CLI is `shadcn`)
- [ ] Backend `pyproject.toml` — drop `redis` (installed but not imported anywhere)

## Phase 1 — Tooling alignment

Bring repo to workspace standard: pnpm, Biome, uv, Node 22, Python 3.12.

- [ ] Frontend: `npm` → `pnpm`. Migrate lockfile, update Dockerfile.
- [ ] Frontend: Node 18 → 22 in Dockerfile + add `.nvmrc`.
- [ ] Frontend: ESLint + Prettier → Biome. Replace configs, delete plugins, run `biome check --apply`.
- [ ] Backend: Poetry → uv. Convert `pyproject.toml`, generate `uv.lock`, simplify Dockerfile (drop `curl … install.python-poetry.org`).
- [ ] Backend: Python 3.11 → 3.12. Verify LangChain/asyncpg/aiosqlite compatibility.
- [ ] Backend: add `ruff` for linting (complements `mypy` type checking).
- [ ] Pre-commit hook (lefthook or pre-commit) running Biome + ruff + mypy on staged files.

## Phase 2 — Frontend modernization

- [ ] React 18 → 19. Bump `@types/react` to 19, verify Phaser ref integration, `react-hook-form` compat.
- [ ] Tailwind 3 → 4. Migrate to CSS-first config (`@theme`), replace `tailwindcss-animate` with `tw-animate-css`.
- [ ] Re-init shadcn/ui with new CLI (`npx shadcn@latest init`), diff existing `components/ui/` against new baseline.
- [ ] Confirm state strategy: `useState` + React Query only (Redux already dropped). Extract socket state into a single subscription hook if prop drilling grows.
- [ ] Type Socket.IO events: `Socket<ServerToClientEvents, ClientToServerEvents>`, events codegenned from backend (see Phase 4).
- [ ] Replace ad-hoc `Logger` utility with `pino` (browser bundle) for structured, level-filtered logs.
- [ ] Split `UIControlsManager.ts` (512 LOC, exceeds 500-LOC soft cap) into camera / overlay / input sub-managers.

## Phase 3 — Backend modernization

- [ ] FastAPI + uvicorn + Pydantic minor-version bumps.
- [ ] LangChain → LangGraph rewrite. Model scene tick as explicit state machine (nodes per character turn), drop manual `asyncio.sleep` + scheduling in `SceneManager`. Slimmer `ConversationManager` / `LLMManager`.
- [ ] Remove module-level service singletons (`scene_config_service = SceneConfigService()` in endpoints). Use FastAPI `Depends` + lifespan context.
- [ ] Structured logging via `structlog` (JSON in prod, pretty in dev). Replace `print(…)` in socket handlers.
- [ ] Introduce Alembic for migrations. Retire `init_db.py` (`create_all()`) — irreversible on schema changes.
- [ ] Audit async SQLAlchemy session lifecycle. Ensure one session per request/tick, no module-level globals.
- [ ] Decide Redis: introduce (multi-instance scene sync) or drop dependency.

## Phase 4 — Cross-stack type safety

- [ ] Auto-generate TypeScript client from FastAPI OpenAPI (`openapi-typescript` + `openapi-fetch`). `pnpm codegen` script.
- [ ] Socket.IO event contract: Pydantic models → JSON Schema → TypeScript. Pick one source of truth (recommend: Pydantic models exported on a Socket API index endpoint, TS codegen consumes).
- [ ] Migrate frontend REST calls in `use-config.ts`, `use-scenes.ts` to generated client.

## Phase 5 — Testing

- [ ] Backend: `pytest` + `pytest-asyncio` + `httpx.AsyncClient`. Unit tests for `SceneManager` tick loop + `ConversationManager` turn-taking with mocked LLM responses. In-memory SQLite fixture.
- [ ] Frontend: `vitest` + Testing Library for React components. Skip Phaser scenes.
- [ ] E2E: Playwright smoke — page loads, socket connects, first `scene_state` arrives, at least one character message renders.
- [ ] Coverage floors enforced in CI (target: backend ≥60%, frontend ≥40% on first pass).

## Phase 6 — LLM infrastructure

- [ ] Route LangChain `ChatOpenAI`/`ChatAnthropic` through LiteLLM gateway at `llm.yester.cloud` (OpenAI-compatible `base_url`). Centralized keys, rate limits, usage tracking.
- [ ] Externalize character prompts from `llm_manager.py` into `backend/app/prompts/*.md`. Scene config references by name.
- [ ] Move `DEFAULT_MODEL` from code constant to DB-stored per-character config. Hot-swappable without redeploy.

## Phase 7 — Security & auth

- [ ] Rate limiting via `slowapi` on REST + socket connect. Per-IP limits.
- [ ] Tighten CORS: explicit `allow_methods` and `allow_headers` instead of `["*"]`.
- [ ] Decide on auth: either remove unused `python-jose` + `passlib` deps, or wire real OAuth (Logto/Authentik).
- [ ] Scene-proposal endpoint spam protection (rate limit + optional hCaptcha).

## Phase 8 — CI/CD

- [ ] GitHub Actions: lint (Biome + ruff), typecheck (tsc + mypy), test (vitest + pytest + playwright), build (pnpm build + both Dockerfiles).
- [ ] Matrix: Node 22, Python 3.12.
- [ ] Push images to GHCR on `main` merge.
- [ ] Renovate config for automated dependency bumps.
- [ ] Production deploy target confirmed (current demo: `pixeltales.0fo.de`).

## Phase 9 — Observability (optional)

- [ ] `opentelemetry-instrumentation-fastapi` + `opentelemetry-instrumentation-sqlalchemy`.
- [ ] Socket metrics as Prometheus gauges: visitor count, message rate, LLM latency p95.
- [ ] Export target: Grafana Cloud or self-hosted Loki/Tempo.

---

## Execution order

Phase 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → (9).

Phase 3 (LangGraph) is the heaviest single-phase rewrite; can be parallelized with Phase 4 (codegen) since they touch different surfaces.
