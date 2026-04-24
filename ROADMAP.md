# PixelTales Modernization Roadmap

Baseline: MVP commit `b91ae54` (April 2025). Python 3.11 + FastAPI + Poetry + LangChain, React 18 + Vite + Phaser 3 + npm, Node 18 in Dockerfile. No tests, no CI, Redux installed but unused.

Target: workspace-standard stack (pnpm, Biome, uv, Node 22, Python 3.12), typed cross-stack contracts, structured logging + metrics, deployable via GitHub Actions.

---

## Phase 0 ✅ — Dead code cleanup

- [x] `apps/`, `packages/`, `supabase-backup/` moved to `.archive/`
- [x] `.project/V1/` removed (backed up to `.archive/legacy/.project/V1/`)
- [x] frontend deps: drop `@reduxjs/toolkit`, `react-redux`, `@types/react-redux`, `@shadcn/ui`
- [x] backend deps: drop `redis`

## Phase 1 ✅ — Tooling alignment

- [x] Frontend: npm → pnpm, Node 18 → 22, ESLint+Prettier → Biome, `.nvmrc`
- [x] Backend: Poetry → uv, Python 3.11 → 3.12, asyncpg 0.29 → 0.30, ruff
- [x] Pre-commit hook: lefthook

## Phase 2 ✅ — Frontend modernization

- [x] Atomic Design folder structure (`components/{atoms,molecules,organisms,templates}/`)
- [x] Move 6 top-level components to `organisms/`, switch to `@/` alias
- [x] Replace ad-hoc `Logger` with pino (browser bundle), retire chalk
- [x] Split `UIControlsManager.ts` into manager + factory
- [x] React 18 → 19 (no source changes needed)
- [x] Tailwind 3 → 4 (CSS-first config in `index.css`, `@tailwindcss/vite`, `tw-animate-css`)
- [x] State strategy confirmed: `useState` + React Query only

## Phase 3a ✅ — Backend mechanical modernization

- [x] FastAPI 0.115 → 0.118+, Pydantic 2.10 → 2.11
- [x] structlog (dev: pretty console, prod: JSON), all `print()` and `logging.getLogger` migrated
- [x] Module-level singleton in `endpoints/scenes.py` → FastAPI `Depends`
- [x] Alembic introduced; entrypoint stamps pre-Alembic DBs and runs `alembic upgrade head`
- [x] CORS tightened: explicit methods + headers
- [x] Pre-existing mypy bug fixed (`ChatAnthropic` missing `model` arg)

## Phase 4a ✅ — REST OpenAPI codegen

- [x] `backend/scripts/dump_openapi.py` → `backend/openapi.json`
- [x] Frontend: `openapi-typescript` (dev) + `openapi-fetch` (runtime), `pnpm codegen`
- [x] `src/api/client.ts` typed client + `Schemas` alias
- [x] `use-config.ts`, `use-scenes.ts`, `SceneProposalForm` migrated to generated types

## Phase 4b ✅ — Socket.IO event typing

- [x] Backend `socket_events.py` schemas-only catalog endpoint
- [x] Frontend `src/api/socket-events.ts` maps generated schemas to `ServerToClientEvents` / `ClientToServerEvents`
- [x] `services/socket.ts` uses `Socket<ServerToClientEvents, ClientToServerEvents>`

## Phase 5 ✅ — Testing infrastructure

- [x] Backend: pytest + pytest-asyncio + httpx, in-memory SQLite fixture
- [x] Latent SceneManager bug fixed (`asyncio.create_task` out of `__init__` → lifespan `start()`)
- [x] Frontend: vitest + jsdom + @testing-library/react (5 tests)
- [x] Playwright config + smoke test (`pnpm test:e2e` after `pnpm exec playwright install chromium`)
- [x] **Substantive backend tests** (26 unit tests across 4 files):
  - `test_conversation_manager.py` (15): speaking-time math, context-window truncation, history role mapping (AIMessage vs HumanMessage), system-message vars, retry-on-error, max-retries-exhausted
  - `test_scene_manager.py` (11): visitor add/remove, conversation_active toggle, next-speaker alternation, start() idempotency
  - `test_health.py` / `test_config_endpoint.py` / `test_scene_config_service.py` (4): endpoint smoke
  - Plus bug found + fixed via test: `ConversationManager` was calling structlog's `logger.warning(event, str(e), extra={...})` with stdlib-`logging` signature — silently TypeError-crashed inside the retry-exhausted branch.

## Phase 6a ✅ — LiteLLM gateway support

- [x] Env: `LITELLM_BASE_URL`, `LITELLM_API_KEY`. When set, all providers route through the gateway via OpenAI-compatible API
- [x] Falls back to direct OpenAI/Anthropic when unconfigured

## Phase 6b ✅ — Prompt externalization

- [x] `app/prompts/system.md` + cached loader. SYSTEM_PROMPT loaded from markdown — edit the file, no code change needed.

## Phase 7 ✅ — Security

- [x] CORS tightened (Phase 3a)
- [x] slowapi: global 100/min, 5/min on `/scenes/propose`, 30/min on `/vote`
- [x] Drop unused `python-jose` + `passlib` deps

## Phase 8 ✅ — CI/CD

- [x] `.github/workflows/ci.yml`: backend + frontend jobs in parallel, cached uv + pnpm, Node 22, Python 3.12
- [x] `.github/workflows/docker.yml`: builds + pushes to GHCR on `main` + tags, GHA layer cache
- [x] `renovate.json`: weekly, semantic commits, grouped React + LangChain bumps, pinned Docker digests

## Phase 9 ✅ — Observability (Prometheus baseline)

- [x] `prometheus-fastapi-instrumentator` exposes `/metrics`
- [x] Custom metrics in `app/core/metrics.py`: `pixeltales_visitors_active` (gauge), `pixeltales_messages_total{character}` (counter), `pixeltales_llm_response_seconds{provider,model}` (histogram)
- [x] Socket connect/disconnect updates `visitors_active`
- [x] SceneManager bumps `messages_total`; LLMManager times `ainvoke` with `llm_response_seconds`

---

## Open / Future Work

Items that were intentionally deferred. Each has a "Why deferred" line so future-you (or a future agent) can judge whether the gating condition has changed.

### Backend

- [ ] **LangGraph rewrite of `SceneManager` + `ConversationManager` + `LLMManager`** — model the scene tick as a `StateGraph` with one node per character turn. Drops manual `asyncio.sleep` + scheduling. Audit async SQLAlchemy session lifecycle while at it.
  *Gating now met:* Phase 5 added 26 unit tests covering turn-taking, speaking-time math, context-window truncation, retry/backoff, visitor tracking, and start() idempotency. Rewrite can proceed against this test suite as regression guard — add test-per-behavior for any new LangGraph node semantics.

- [ ] **DB-stored per-character model config** — move `DEFAULT_MODEL` constant + `LLMConfig` from scene proposal payload to a `models` DB table. Hot-swappable without redeploy.
  *Why deferred:* needs Alembic migration **and** scene-proposal UI changes (dropdown reads from DB). Wait until users ask for runtime model swaps.

- [ ] **OpenTelemetry traces** — `opentelemetry-instrumentation-fastapi` + `opentelemetry-instrumentation-sqlalchemy`, OTLP exporter.
  *Why deferred:* no collector endpoint yet. Set one up first (Tempo / Grafana Cloud / self-hosted).

- [ ] **Real OAuth (Logto / Authentik)** — protected endpoints, user identity on socket connect.
  *Why deferred:* PixelTales is a public read-mostly demo today. Only justified if write endpoints (proposals, votes) become abuse vectors that rate-limiting alone can't contain.

- [ ] **hCaptcha on `/scenes/propose`** — additional spam guard.
  *Why deferred:* `slowapi` 5/min limit covers normal abuse. Re-evaluate if logs show distributed spam.

- [ ] **Pydantic v2 `class Config` cleanup** — `app/models/llm.py:6` still uses class-based `Config`, raising `PydanticDeprecatedSince20`. Replace with `ConfigDict`.
  *Why deferred:* warning only, not an error. Trivial fix; pick up next time `models/llm.py` is touched.

- [ ] **`init_db.py` removal** — superseded by Alembic. Currently kept for legacy `python -m app.db.init_db` callers.
  *Why deferred:* zero cost to keep; remove on next backend cleanup pass.

### Frontend

- [ ] **Phaser 3.87 → 3.90** — safe minor bump within the v3 line. Bug fixes + small features, no API churn.
  *Why deferred:* low effort, low value-add — bundle in next dependency sweep.

- [ ] **Phaser 3 → 4 major upgrade** — v4.0.0 is now `latest` on npm. New WebGL render-node architecture (~30% faster on quads), `SpriteGPULayer` ("100×" for mass sprite scenes), `TilemapGPULayer` (whole layer as one quad), unified Filter system (FX + Masks merged), overhauled Tint system with explicit modes via `setTintMode()`. Breaking: `Point`, `Mesh`, `BitmapMask` removed; Shader API changed; lighting simplified. Official migration guide exists; **not** a drop-in replacement.
  *PixelTales API surface:* `Phaser.GameObjects.{Container,Graphics,Sprite,Text}`, `Phaser.Input.Keyboard.*`, `Phaser.Scale.{FIT,CENTER}`, `Phaser.Scenes.Events.*`, `Phaser.Tweens.Tween`, `Phaser.AUTO`. **None of the removed classes are used.** Tint usage in `UIControlsFactory.animateButton` (`setTint(0xcccccc)`) is the most likely friction point — check if `setTint` still works without explicit `setTintMode()`.
  *Why deferred:* not a blocker — current 3.87 runs fine, performance isn't a complaint. Pick up when (a) we need the perf wins (e.g. way more sprites/tiles) or (b) bundling Phaser 4 saves enough bundle size to matter. Pair with bundle-splitting task.

- [ ] **shadcn/ui refresh** — re-init with `npx shadcn@latest init`, diff `components/ui/*` against the new baseline (current files predate React 19 + Tailwind 4).
  *Why deferred:* current components work. shadcn `forwardRef` usage is deprecated in R19 but not removed. Re-do when something visually breaks or when adding a new shadcn primitive.

- [ ] **Migrate `@/types/scene` consumers to generated types** — currently a hand-typed `SceneState` exists alongside `Schemas['SceneState']`. They're nearly identical; the cast in `services/socket.ts` bridges them.
  *Why deferred:* large diff for marginal benefit. Sweep when the hand-typed schema actually drifts from the generated one.

- [ ] **Bundle splitting** — production JS is 2.4 MB (mostly Phaser). `manualChunks` to split vendor / Phaser / app.
  *Why deferred:* page is fast enough on broadband; LCP bottleneck is Phaser asset loading, not JS parse. Re-visit when mobile users complain.

### Test / CI

- [ ] **Coverage floors in CI** — pytest-cov + vitest coverage gates (target backend ≥60%, frontend ≥40% on first pass).
  *Why deferred:* baseline is too thin (4 + 5 tests). Set floors when there's real coverage to hold the line on.

- [ ] **Playwright in CI** — workflow boots compose stack, runs `pnpm test:e2e`.
  *Why deferred:* needs compose setup in the workflow file + chromium install + secrets for `OPENAI_API_KEY`. Wait until E2E suite has more than the smoke test.

- [x] ~~Substantive backend tests~~ — done as part of Phase 5.

### Workspace / scope

- [ ] **Workspace-root `~/Sync/home/alex/Code/WebDev/CLAUDE.md`** — pixeltales entry says "Turborepo. NestJS, Drizzle, React" (V1 leftover, since-deleted). Should describe the actual stack.
  *Why deferred:* outside this project's git repo. Pick up during a workspace-wide CLAUDE.md sweep.

- [ ] **Production deploy target documented** — current live demo is `pixeltales.0fo.de`. Codify how it's deployed (compose? K8s?) so the GHCR-pushed images can be wired to it.
  *Why deferred:* needs your input on the actual hosting setup.

---

## Execution log

Phases shipped in order: 0 → 1 → 2 → 3a → 4a → 5 → 6a → 7 → 8 → 9 → 4b → 6b. 13 commits between `021f5dd` and `4bb3574`.
