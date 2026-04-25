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

- [x] ~~**PydanticAI migration of the LLM layer**~~ (commit `fb834c5`) — `LLMManager` + `ConversationManager._prepare_conversation_history` migrated to pydantic-ai 1.86. Drops 5 `langchain-*` packages, native structured-output, LiteLLM-gateway-compatible. Original roadmap entry mistakenly promised "drops manual sleeps"; sleeps stayed (animation pacing).

- [x] ~~**Architecture refactor — 4-layer Agent / Harness / World / Client separation**~~ ✅ shipped 2026-04-24 (commits `d37b3da` Phase A docs, `30e494b` Phase E, `a4e8a23`/`959a9f2`/`fdb8b1e` Phases B/C/D, merges `128b180` + `5363f8b`, hotfix `f507d2c`). All 4 layers live in `app/{agent,harness,world,client}/`. Phase E executed by parallel subagent in worktree `phase-e/`; B+C+D sequenced by another subagent in worktree `phase-bcd/`. 38 tests green, mypy clean (37 source files), coverage 64.60%, browser smoke verifies World → SocketIOClient broadcast pipeline end-to-end. One bug found post-merge (`f507d2c` — structlog `event=` kwarg shadowed reserved key in 2 sites; tests didn't catch because they don't fire WorldEvents). See [`docs/architecture.md`](docs/architecture.md) for the canonical model.

- [ ] **DB-stored per-character model config** — move `DEFAULT_MODEL` constant + `LLMConfig` from scene proposal payload to a `models` DB table. Hot-swappable without redeploy.
  *Why deferred:* needs Alembic migration **and** scene-proposal UI changes (dropdown reads from DB). Wait until users ask for runtime model swaps.

- [ ] **OpenTelemetry traces** — `opentelemetry-instrumentation-fastapi` + `opentelemetry-instrumentation-sqlalchemy`, OTLP exporter.
  *Why deferred:* no collector endpoint yet. Set one up first (Tempo / Grafana Cloud / self-hosted).

- [ ] **Real OAuth (Logto / Authentik)** — protected endpoints, user identity on socket connect.
  *Why deferred:* PixelTales is a public read-mostly demo today. Only justified if write endpoints (proposals, votes) become abuse vectors that rate-limiting alone can't contain.

- [ ] **hCaptcha on `/scenes/propose`** — additional spam guard.
  *Why deferred:* `slowapi` 5/min limit covers normal abuse. Re-evaluate if logs show distributed spam.

- [x] ~~**[Agent]** **Per-cognitive-tier LLM routing via gateway aliases**~~ ✅ shipped 2026-04-25 (commit `329fdff`). `.character.yaml` `llm.tier:` shorthand (XOR with explicit `provider`+`model`). Loader builds `LLMConfig(provider="openai", model_name=<tier>)` — gateway resolves alias to upstream model. 8 tier-loader tests. Alice migrated to `tier: cheap` in `29bef8a` (DeepSeek via gateway, ~5x cheaper for chitchat).

- [x] ~~**[Agent]** **Per-character skills (agentskills.io SKILL.md format)**~~ ✅ shipped 2026-04-25 (commit `37343c2`). Skills live at `app/agent/skills/<name>/{SKILL.md, tool.py}`. Characters opt in via `skills: [<name>, ...]` in `.character.yaml`. `LLMManager._build_agent` registers each as PydanticAI tool. Stub skill `recall_about_npc` ships as canary. **Architecture change:** dropped LLMConfig hash dedup in LLMManager — 1 Agent per character now (skills differ per character; 2-7 instances/scene is trivial). 12 skill tests + 6 character `skills:` field tests.

- [x] ~~**[Client + Agent]** **Streaming responses (typing animation)**~~ ✅ shipped 2026-04-25 (commit `99c4818` backend, frontend follow-up). 4-layer end-to-end:
  - **Agent**: `LLMManager.generate_response_stream()` wraps `agent.run_stream()` + `result.stream_output(debounce_by=0.1)`, yields cumulative `CharacterResponse` partials via pydantic-ai partial validation.
  - **Harness**: `ConversationManager.generate_message_stream()` + `_partial_to_message` helper. Retry semantics differ from non-streaming path: 3× retries pre-stream only, mid-stream failure → rule-based fallback (no retry, prevents bubble jitter).
  - **World**: new `SceneState.streaming_message` (wire-included, snapshot-excluded so late-joining viewers see in-progress bubbles, but server crash drops the in-flight stream cleanly). Three new events: `MessageStreamStarted` / `Updated` / `Completed`. Action choreography: `speaking` w/ duration=None at start, refreshed to `calculated_speaking_time` (read-time window) at completion.
  - **Orchestrator**: `_set_character_speaking()` rewritten — `thinking` → `start_streaming_message` → consume stream + `update_streaming_message` per partial → `complete_streaming_message` → mood + end-conversation-request → sleep(read-time).
  - **Frontend**: `SpeechBubbleManager.upsertSpeechBubble` does in-place text + emoji updates instead of destroy+recreate, so 10 Hz partials don't cause flicker. Prefers `state.streaming_message` over `state.messages.last` when matching a speaker.
  - **Crucially**: `calculated_speaking_time` stays as the *read-time* (post-stream dwell) — stream duration is real LLM time, not double-counted. Original roadmap entry's "would replace that timing model" framing was wrong; the two are orthogonal.
  - **Tests**: +20 backend (4 LLM + 5 ConversationManager-stream + 13 World-stream + 2 Harness-end-to-end), 89 backend tests green.

- [x] ~~**[Harness]** **Multi-NPC support (>2 characters + decision thresholds)**~~ ✅ shipped 2026-04-25 (commit `c7b93bc`). `_get_next_speaker` now uses weighted-random choice biased against recently-spoken characters (recency penalty -0.7/-0.5/-0.3 for last 3 turns) and end-of-conversation requesters (×0.5), with a 0.05 floor. 2-character scenes still alternate (single non-last-speaker = deterministic pick). New 3-character `three_character_scene` fixture (alice + bob + doctor_1). 6 new tests.

- [x] ~~**[Harness]** **Rule-based fallbacks when the LLM provider is down**~~ ✅ shipped 2026-04-25. `ConversationManager.generate_message` now returns a templated `Message` after retry-exhaustion instead of raising `RuntimeError`. 4 templates (`{name} nods silently.`, `looks distracted`, `hesitates, lost in thought`, `stays quiet for a moment`), `mood="quiet" 😶`, `end_conversation=False` so transient outages don't terminate the scene. New `_build_fallback_message` helper, `FALLBACK_TEMPLATES` module constant. Old test `test_raises_after_max_retries` rewritten to assert fallback shape; new test pins recipient default. 65 backend tests green.

- [ ] **[Cross-cutting]** **Grafana board for the Prometheus metrics** — Phase 9 exposes `/metrics` (`pixeltales_visitors_active`, `pixeltales_messages_total{character}`, `pixeltales_llm_response_seconds{provider,model}`) but nothing visualizes them. A public Grafana board would make the live demo "alive" for observers + give us regression visibility.
  *Why deferred:* needs a Grafana endpoint to point at. Same gating as OpenTelemetry traces above — set up the observability host first, then wire both at once.

- [x] ~~Pydantic v2 `class Config` cleanup~~ — replaced with `ConfigDict` in `models/llm.py`.

- [x] ~~`init_db.py` removal~~ — deleted; Alembic is the single source of schema truth.

### Frontend

- [x] ~~Phaser 3.87 → 3.90~~ — bumped. Typecheck + build clean, no API changes needed.

- [ ] **Phaser 3 → 4 major upgrade** — v4.0.0 is now `latest` on npm. New WebGL render-node architecture (~30% faster on quads), `SpriteGPULayer` ("100×" for mass sprite scenes), `TilemapGPULayer` (whole layer as one quad), unified Filter system (FX + Masks merged), overhauled Tint system with explicit modes via `setTintMode()`. Breaking: `Point`, `Mesh`, `BitmapMask` removed; Shader API changed; lighting simplified. Official migration guide exists; **not** a drop-in replacement.
  *PixelTales API surface:* `Phaser.GameObjects.{Container,Graphics,Sprite,Text}`, `Phaser.Input.Keyboard.*`, `Phaser.Scale.{FIT,CENTER}`, `Phaser.Scenes.Events.*`, `Phaser.Tweens.Tween`, `Phaser.AUTO`. **None of the removed classes are used.** Tint usage in `UIControlsFactory.animateButton` (`setTint(0xcccccc)`) is the most likely friction point — check if `setTint` still works without explicit `setTintMode()`.
  *Why deferred:* not a blocker — current 3.87 runs fine, performance isn't a complaint. Pick up when (a) we need the perf wins (e.g. way more sprites/tiles) or (b) bundling Phaser 4 saves enough bundle size to matter. Pair with bundle-splitting task.

- [ ] **shadcn/ui refresh** — re-init with `npx shadcn@latest init`, diff `components/ui/*` against the new baseline (current files predate React 19 + Tailwind 4).
  *Why deferred:* current components work. shadcn `forwardRef` usage is deprecated in R19 but not removed. Re-do when something visually breaks or when adding a new shadcn primitive.

- [x] ~~**Migrate `@/types/scene` consumers to generated types**~~ — `scene.ts` is now a thin re-export layer over `Schemas['...']`; `Direction` + `CharacterAction` extracted via indexed access. Cast in `services/socket.ts` removed. (`3001cb6`)

- [x] ~~**Bundle splitting**~~ — `manualChunks` splits prod into phaser (1.5 MB), vendor (416 kB), recharts (249 kB), react-vendor (194 kB), query-vendor (46 kB), index/app (89 kB). Phaser still over 500 kB warning threshold but unsplittable without dynamic import (which would defer game load). (`4c4e7c5`)

### Test / CI

- [x] ~~**Coverage floors in CI**~~ — pytest-cov + vitest `@vitest/coverage-v8` wired into CI, HTML/XML reports uploaded as artifacts. Backend floor at 55% (current 62.63%); frontend has no gate yet because the 5-test baseline only covers `format.ts` (~1% overall) — set a floor once components/hooks tests exist.

- [x] ~~**Playwright in CI**~~ — new `e2e` job in `ci.yml` boots backend (uvicorn) + frontend (vite preview) natively as background processes (no compose, lighter than docker), waits on health checks, runs the existing 2-test smoke suite, uploads `playwright-report` artifact on failure. Browser cache keyed on `pnpm-lock.yaml`. Smoke uses `OPENAI_API_KEY=sk-ci-placeholder` since it doesn't trigger LLM calls.

- [x] ~~Substantive backend tests~~ — done as part of Phase 5.

### Workspace / scope

- [ ] **Workspace-root `~/Sync/home/alex/Code/WebDev/CLAUDE.md`** — pixeltales entry says "Turborepo. NestJS, Drizzle, React" (V1 leftover, since-deleted). Should describe the actual stack.
  *Why deferred:* outside this project's git repo. Pick up during a workspace-wide CLAUDE.md sweep.

- [ ] **Production deploy target documented** — current live demo is `pixeltales.0fo.de`. Codify how it's deployed (compose? K8s?) so the GHCR-pushed images can be wired to it.
  *Why deferred:* needs your input on the actual hosting setup.

---

## ✅ Shipped: Post-modernization track (2026-04-24)

Brainstormed 2026-04-24. Spec: `docs/superpowers/specs/2026-04-24-scene-content-ux-refactor-design.md`. All three clusters landed plus a bonus character-library SSOT refactor.

- **Scene Content (b)** — dynamic character sprites + rooms from a backend-served catalog.
  1. [x] Backend asset catalog in `app/config.py`, `CharacterConfig.sprite_id`, `SceneConfig.room_id` (`08b4d5f`)
  2. [x] Frontend `CharacterManager` + `MainScene` dynamic sprite/room loading (`252b3ab`)
  3. [x] Scene-proposal form: sprite + room dropdowns (`b119c26`)

- **Visitor UX Polish (a, cautious)**:
  4. [x] V-align "is thinking" text in `ConversationHistory` (`1d47744`)
  5. [x] Move side-view toggle into `ConversationHistory` toolbar (`1d47744`)

- **Tech Refactoring (e)**:
  6. [x] Split `SceneConfig` data out of `SceneState` snapshots (`605dd19`)

- **Bonus — Character library SSOT** (not in original spec, emerged from conversation):
  7. [x] AGENTS.md + .character.yaml per character, 3-model split (Identity / Placement / Config) (`b46b482` + `b9ddf22`)

## Wishlist — Parking Lot (from `.private/.notes/PROMPTS.md`)

Alex's ratings: `[++]` high → `[--]` very low. Pick from here when next planning.

- [x] ~~`[++]` Zoom in/out on conversation rating chart~~ — `recharts` `Brush` component below the LineChart for drag-to-zoom + scroll. "Reset zoom" `<ZoomOut/>` button next to the chart heading; disabled when at full extent.
- [ ] `[o]` Proper context windowing (smarter than last-20-messages)
- [ ] `[o]` Conversation summary email to proposer on scene end
- [ ] `[o]` Download conversation summary as CSV / JSON (research dataset)
- [ ] `[o]` SSO (Google, GitHub)
- [ ] `[o]` Mobile orientational split-screen (game canvas / conversation history)
- [ ] `[o]` Fullscreen mode (sticky btn in game canvas)
- [ ] `[o]` Language Selection (Top Languages + free-text dialect, translated system prompts hashed + cached in DB)
- [ ] `[-]` New Scene Templates (Tiled `.tmx` rendering, not just PNG backgrounds)
- [ ] `[--]` Character Sprites Builder (multi-step LLM workflow — prompt → base → animation-sheet → coord-extraction → per-sprite-regen, big lift, see PROMPTS.md for full spec)
- [ ] `[--]` PydanticAI substitute for LangChain (testing)
- [ ] `[--]` Twitch streaming of the scene
- [ ] `[--]` Research gather.town features

Mined from `.archive/agent-architecture.md` + `.private/.notes/PROMPTS.md` (2026-04-24):

- [ ] `[o]` **Social memory / relationship tracking** — characters remember facts about each other ("Alice learned Bob is sarcastic") from observation, not metadata. Implementation candidate: [PARA method](https://fortelabs.com/blog/para/) per NPC (Projects = current scene goals, Areas = relationships, Resources = world facts, Archives = past scenes), exposed to the Agent layer as agentskills.io skills (see Backend "per-character skills" item).
- [ ] `[o]` **Goal Manager / long-horizon arcs** — composite multi-turn objectives ("Alice tries to convince Bob to help her find the treasure") persisted across turns. Needs goal-state schema + planner-style reasoning step before each turn.
- [ ] `[o]` **Embedding-based memory retrieval (pgvector)** — replace fixed-window-truncation with vector relevance. Only sinnvoll if multi-session continuity becomes a feature (i.e. scenes stop being ephemeral).
- [ ] `[o]` **Async reflection offload** — move psychology/communication-analysis prompts off the hot path onto a background worker queue. Frees the main loop for visitor interactions, lets reflection-on-conversation be richer without blocking turn-taking.
- [ ] `[-]` **Visitor-count → character-behavior signal** — broadcast `visitors_active` (already a Prometheus gauge) into character context so NPCs can "feel audience pressure" — speak louder with 100 watching, intimate with 2.

## ✅ Closed: Character Library — AGENTS.md adoption complete

All gaps from the prior open section closed in one commit (B1 path chosen):

- [x] `default_scene.branding.py` — Claude + ChatGPT migrated into `app/characters/{claude,chatgpt}/`; file collapsed to placement-only composition.
- [x] `POST /api/v1/scenes/propose` — schema slimmed to `dict[str, CharacterPlacement]`; the form now POSTs `/api/v1/characters` per "create new" row before submitting the scene proposal. Library characters can also be picked from a dropdown per row.
- [x] `scene_configs.config` storage now slim — character entries are placement-only in the JSON column; identity hydrated from the library on read. Pre-library DB rows still work via a fallback that uses the embedded identity if present.
- [x] `tests/fixtures.py` builds Configs from `load_character("alice"|"bob")` — same path production uses.
- [x] Frontend `SceneProposalForm` gets a per-row "Library character" dropdown ("Create new…" reveals the inline identity fields).
- [x] `app/characters/README.md` documents the loader contract (required yaml keys, slug rules, error behavior, programmatic API).
- [x] B1 chosen: `backend/data/characters/` mounted as a compose volume; `POST /api/v1/characters` writes `<id>/AGENTS.md + .character.yaml` there. Slug-collision handling: `409 Conflict` returned, surfaced in the form.

## ✅ Closed: Tech debt + cleanup (2026-04-24)

Honest inventory of gaps that were hand-waved past during the
post-modernization track. Same discipline as the character library
section: don't ship more feature work until this is closed. **All
18 items shipped in 8 focused commits this session.**

### A — Dead code & drift

- [x] ~~**`backend/app/default_scene.branding.py` is unused.**~~ Deleted (`8e0d11e`). Claude + ChatGPT live in the library.
- [x] ~~**`# Pydantic validation debugging` block in `backend/app/models/scene.py`**~~ Deleted (`8e0d11e`).
- [x] ~~**`_ = None` placeholder in `SceneBase`**~~ Removed; `SceneConfigCommon` + `SceneState` extend `BaseModel` directly (`8e0d11e`).

### B — Anti-patterns I introduced today

- [x] ~~**Coverage `omit` includes `default_scene*.py`**~~ Removed from omit (`0772ca5`); coverage holds at 62.89%.
- [x] ~~**`# type: ignore[arg-type]` ×2 in `default_scene{,.branding}.py`**~~ Typed `_place(direction: Direction)`; ignore dropped (`0772ca5`).

### C — Pre-existing biome warnings (9, all skipped since first commit today)

- [x] ~~All 9 baseline biome warnings fixed (`da3aa22`)~~ — `useFieldArray` for the form rows, stable keys via `unix_timestamp + character`, conditional render for nullable `proposed_at`, explicit null-check in `main.tsx`, `Record<never, never>` for empty event map, hook API rework + targeted `biome-ignore` for the trigger-array case, explicit body block on the forEach.

### D — Pre-existing TODO comments

- [x] ~~`scene_manager.py:190 ## TODO use conversation manager`~~ Replaced with explanatory comment (`13b5510`).
- [x] ~~`index.css:152 /* TODO use bg-background */`~~ `body` switched to `bg-background` token (`13b5510`).

### E — Operational debt

- [x] ~~**DB is 1.3 GB.**~~ Both pieces shipped (`004802b`): runtime retention via `Settings.SCENE_SNAPSHOT_RETENTION` (default 10) auto-prunes after every snapshot write; one-shot `scripts/prune_snapshots.py` (dry-run by default, `--yes` to apply + VACUUM). User runs the one-shot script when ready; the retention is self-healing from now on.
- [x] ~~**Frontend coverage stuck at 1%.**~~ Brought up to 16.5% with hook + component tests (`use-config`, `use-characters`, `use-scenes`, `ConversationHistory` render). Real threshold floor set in `vite.config.ts` (statements 15, branches 9, functions 8, lines 15).
- [x] ~~**Spec "Open Questions"**~~ Both questions resolved in spec body as "Resolved Open Questions".
- [x] ~~**`vitest.config.ts` is a separate file**~~ Merged into `vite.config.ts` (`574d43f`). Single config, plugins shared between dev/build/test.

### F — Decisions taken implicitly that deserve revisiting

- [x] ~~**Pydantic `extra="ignore"` is the default everywhere.**~~ Boundary models (`Position`, `LLMConfig`, `Message`, `Comment`, `CharacterIdentity`, `CharacterPlacement`, `CreateSceneConfig`) now `extra="forbid"`. Legacy read paths (`SceneState`, `SceneConfig`, `CharacterState`, `CharacterConfig`) keep the default. New `tests/test_extra_forbid.py` (8 tests) pins the policy against future regressions. (`06b583e`)



Phases shipped in order: 0 → 1 → 2 → 3a → 4a → 5 → 6a → 7 → 8 → 9 → 4b → 6b, then substantive tests + quick-wins bundle. Commits `021f5dd` … `d567dcd`.

**Post-modernization track (2026-04-24)** — scene-content + UX + tech-refactor + library SSOT, then a tech-debt sweep + browser-smoke fix:

1. Scene-content + UX + state/config split: `08b4d5f` → `252b3ab` → `b119c26` → `1d47744` → `605dd19`
2. Character library: `b46b482` (v1, partial — only seeds) → `0d96a0b` (flagged gap in roadmap) → `b9ddf22` (library is now SSOT — branding scene + scene-proposal write path + DB schema slim + tests + frontend form rework + GET/POST /characters + data/ volume mount)
3. Low-hanging post-cleanup: `6283d7c` (roadmap hygiene) → `3001cb6` (`@/types/scene` re-exports generated types) → `4c4e7c5` (bundle splitting) → `43792f7` (coverage in CI) → `988e1fc` (Playwright in CI e2e job) → `f3ac3bf` (chart zoom)
4. Tech-debt sweep: `4f82bcd` (inventory) → `8e0d11e` (A: dead code) → `0772ca5` (B: own anti-patterns) → `13b5510` (D: stale TODOs) → `da3aa22` (C: 9 lint warnings) → `004802b` (E14: snapshot retention + prune script) → `06b583e` (F19: extra="forbid" sweep + 8 boundary tests) → `574d43f` (E18: vitest config merge) → `37de70c` (E15: hook + component tests, coverage 1% → 16.5%)
5. Browser smoke + bugfix: `1db547e` (MainScene tolerates Phaser boot-time init) → `2059032` (`pnpm diag` headless smoke tool) → `f9f1db1` (biome.json overrides cleanup)

Browser smoke test confirmed working end-to-end via `pnpm diag` after `1db547e`. Local DB still 1.4 GB; user runs `prune_snapshots.py --yes` when convenient (~99% reduction).
