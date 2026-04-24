# PixelTales Modernization Roadmap

Baseline: MVP commit `b91ae54` (April 2025). Python 3.11 + FastAPI + Poetry + LangChain, React 18 + Vite + Phaser 3 + npm, Node 18 in Dockerfile. No tests, no CI, Redux installed but unused.

Target: Workspace-standard stack (pnpm, Biome, uv, Node 22, Python 3.12), typed cross-stack contracts, LangGraph-based multi-agent orchestration, test coverage, deployable via GitHub Actions.

## Phase 0 ✅ — Dead code cleanup

- [x] `apps/`, `packages/`, `supabase-backup/` — user moved to `.archive/`
- [x] `.project/V1/` — removed (backed up to `.archive/legacy/.project/V1/`)
- [x] `frontend/package.json` — dropped `@reduxjs/toolkit`, `react-redux`, `@types/react-redux`, `@shadcn/ui`
- [x] Backend `pyproject.toml` — dropped `redis`
- [ ] Workspace-root `CLAUDE.md` pixeltales entry (out of project scope, deferred)

## Phase 1 ✅ — Tooling alignment

- [x] Frontend: `npm` → `pnpm` (`pnpm-lock.yaml`, Dockerfile w/ corepack)
- [x] Frontend: Node 18 → 22 in Dockerfile + `.nvmrc`
- [x] Frontend: ESLint + Prettier → Biome (biome.json)
- [x] Backend: Poetry → uv (`uv.lock`, Dockerfile w/ `ghcr.io/astral-sh/uv`)
- [x] Backend: Python 3.11 → 3.12, asyncpg 0.29 → 0.30
- [x] Backend: ruff added (config in pyproject.toml)
- [x] Pre-commit hook: lefthook (`lefthook.yml`)

## Phase 2 — Frontend modernization

- [ ] **Atomic Design restructure** — introduce `components/{atoms,molecules,organisms,templates}/`. shadcn/ui stays at `components/ui/` (acts as atoms). Move the 6 top-level components (`ColorPalette`, `ConversationHistory`, `ConversationStatsChart`, `SceneInfo`, `SceneProposalForm`, `SceneProposalList`) into `organisms/`. Leave `atoms/` + `molecules/` empty until actual reuse appears (no premature abstraction).
- [ ] Replace ad-hoc `Logger` utility with `pino` (browser bundle) for structured, level-filtered logs. Retire `chalk` dep.
- [ ] Split `UIControlsManager.ts` (512 LOC, exceeds 500-LOC soft cap) into camera / overlay / input sub-managers.
- [ ] React 18 → 19. Bump `@types/react` to 19, verify Phaser ref integration, `react-hook-form` compat.
- [ ] Tailwind 3 → 4. Migrate to CSS-first config (`@theme`), replace `tailwindcss-animate` with `tw-animate-css`.
- [ ] Re-init shadcn/ui with new CLI (`npx shadcn@latest init`), diff existing `components/ui/` against new baseline.
- [ ] Confirm state strategy: `useState` + React Query only (Redux already dropped). Extract socket state into a single subscription hook if prop drilling grows.
- [ ] Type Socket.IO events: deferred to Phase 4 (handled as part of cross-stack codegen).

## Phase 3a ✅ — Backend mechanical modernization

- [x] FastAPI 0.115 → 0.118+, Pydantic 2.10 → 2.11.
- [x] structlog (dev: pretty console, prod: JSON). All `print()` and `logging.getLogger` migrated.
- [x] Module-level singleton in `endpoints/scenes.py` → FastAPI `Depends` (`@lru_cache` factory).
- [x] Alembic introduced. Initial migration auto-generated. Entrypoint stamps pre-Alembic DBs and runs `alembic upgrade head`.
- [x] CORS tightened: explicit methods + headers (no more `["*"]`).
- [x] pre-existing mypy bug fixed (`ChatAnthropic` missing `model` arg).
- [x] Redis dropped (Phase 0).

## Phase 3b — LangGraph rewrite (deferred to after Phase 5)

Without test coverage, a big-bang rewrite of `SceneManager` + `ConversationManager` + `LLMManager` is too risky.

- [ ] Model scene tick as LangGraph `StateGraph` (nodes per character turn).
- [ ] Drop manual `asyncio.sleep` + scheduling in `SceneManager`.
- [ ] Audit async SQLAlchemy session lifecycle (will mostly be touched here).

## Phase 4a ✅ — REST OpenAPI codegen

- [x] `backend/scripts/dump_openapi.py` — dumps FastAPI OpenAPI to `backend/openapi.json`
- [x] Frontend: `openapi-typescript` (devDep) + `openapi-fetch` (dep). `pnpm codegen` regenerates `src/api/types.gen.ts`.
- [x] `src/api/client.ts` — typed openapi-fetch client + `Schemas` alias
- [x] `use-config.ts` + `use-scenes.ts` migrated to typed client
- [x] `SceneProposalForm` uses generated `CreateSceneConfig` + `CharacterConfig`

## Phase 4b — Socket.IO event typing (deferred)

- [ ] Pydantic models for each Socket.IO event payload, dumped as JSON Schema
- [ ] TS types codegenned via `json-schema-to-typescript`
- [ ] Replace ad-hoc `Socket<any>` in `services/socket.ts` with typed events

## Phase 5 ✅ — Testing infrastructure

- [x] Backend: pytest + pytest-asyncio + httpx, in-memory SQLite fixture (`tests/conftest.py`).
- [x] Baseline tests: /health, /api/v1/config, SceneConfigService basics. 4 tests pass.
- [x] Latent SceneManager bug fixed: `asyncio.create_task` moved out of `__init__` (was failing module import outside event loop). Now lifespan calls `scene_manager.start()`.
- [x] Frontend: vitest + jsdom + @testing-library/react, sample utils tests. 5 tests pass.
- [x] Playwright config + tests-e2e/smoke.spec.ts (page loads, socket connects).
  Run via `pnpm test:e2e` after `pnpm exec playwright install chromium` and stack up.
- [ ] Coverage floors deferred to Phase 8 CI.
- [ ] LangGraph rewrite (Phase 3b) can now proceed safely on top of this baseline.

## Phase 6a ✅ — LiteLLM gateway support

- [x] New env vars: `LITELLM_BASE_URL`, `LITELLM_API_KEY`. When set, every provider call routes through the gateway via OpenAI-compatible API.
- [x] Falls back to direct OpenAI/Anthropic when the gateway is unconfigured.
- [x] `.env.example` documents both setups.

## Phase 6b — Prompt externalization (deferred)

- [ ] Externalize character prompts from `llm_manager.py` into `backend/app/prompts/*.md`. Scene config references by name.
- [ ] Move `DEFAULT_MODEL` from code constant to DB-stored per-character config. Hot-swappable without redeploy. Needs Alembic migration + scene proposal UI changes.

## Phase 7 ✅ — Security

- [x] CORS tightened: explicit methods + headers (Phase 3a).
- [x] slowapi global default 100/min, per-endpoint 5/min on /scenes/propose, 30/min on /vote.
- [x] Drop unused `python-jose` + `passlib` deps (auth path was dead code; deferred until a real auth story is needed).
- [ ] Real OAuth (Logto/Authentik) — only when public production demand exists.
- [ ] hCaptcha on scene-proposal — only if rate limit alone proves insufficient.

## Phase 8 ✅ — CI/CD

- [x] `.github/workflows/ci.yml`: backend (ruff + mypy + pytest) and frontend (biome + tsc + vitest + build) jobs in parallel. Cached uv + pnpm. Node 22, Python 3.12.
- [x] `.github/workflows/docker.yml`: builds both Docker images on `main` push + tags, pushes to GHCR (`pixeltales-backend`, `pixeltales-frontend`) with sha + branch + semver tags. GHA cache for layers.
- [x] `renovate.json`: weekly schedule, semantic commits, grouped React + LangChain bumps, pinned Docker digests.
- [ ] Playwright E2E in CI — deferred (needs docker compose setup in workflow + browser install).
- [ ] Production deploy target confirmed (current demo: `pixeltales.0fo.de`).

## Phase 9 — Observability (optional)

- [ ] `opentelemetry-instrumentation-fastapi` + `opentelemetry-instrumentation-sqlalchemy`.
- [ ] Socket metrics as Prometheus gauges: visitor count, message rate, LLM latency p95.
- [ ] Export target: Grafana Cloud or self-hosted Loki/Tempo.

---

## Execution order

Phase 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → (9).

Phase 3 (LangGraph) is the heaviest single-phase rewrite; can be parallelized with Phase 4 (codegen) since they touch different surfaces.
