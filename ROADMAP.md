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

- [x] ~~Pydantic v2 `class Config` cleanup~~ — replaced with `ConfigDict` in `models/llm.py`.

- [x] ~~`init_db.py` removal~~ — deleted; Alembic is the single source of schema truth.

### Frontend

- [x] ~~Phaser 3.87 → 3.90~~ — bumped. Typecheck + build clean, no API changes needed.

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

## Next Up (post-modernization)

Brainstormed 2026-04-24. Spec: `docs/superpowers/specs/2026-04-24-scene-content-ux-refactor-design.md`.

Three clusters picked by the user:

- **Scene Content (b)** — dynamic character sprites + rooms from a backend-served catalog. Assets already copied into `frontend/public/assets/` (Doctor_1, Doctor_2, Zombie, the-lab, the-lab-w-docs).
  1. [ ] Backend asset catalog in `app/config.py`, `CharacterConfig.sprite_id`, `SceneConfig.room_id`
  2. [ ] Frontend `CharacterManager` + `MainScene` dynamic sprite/room loading
  3. [ ] Scene-proposal form: sprite + room dropdowns

- **Visitor UX Polish (a, cautious)** — two highest-rated items from `.private/.notes/PROMPTS.md`:
  4. [ ] V-align "is thinking" text in `ConversationHistory` (`[++]`)
  5. [ ] Move side-view toggle into `ConversationHistory` toolbar (`[+]`)

- **Tech Refactoring (e)** — scope-limited cleanup:
  6. [ ] Split `SceneConfig` data out of `SceneState` snapshots (dedupe, smaller snapshots)

Explicitly deferred *this round*: visitor engagement (Email, CSV, SSO, translation), platform (Twitch, gather.town), Spritesheet Builder, LangGraph rewrite, Phaser 4.

## Wishlist — Parking Lot (from `.private/.notes/PROMPTS.md`)

Alex's ratings: `[++]` high → `[--]` very low. Pick from here when next planning.

- [ ] `[++]` Zoom in/out on conversation rating chart
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

## Open: Character Library — finish the AGENTS.md adoption

Commit `b46b482` introduced `app/characters/<id>/{AGENTS.md, .character.yaml}` as the format for character definitions and migrated bob, alice, doctor_1, doctor_2, zombie. **The migration is not complete** — three other code paths still define characters in the old shape, which means today *the project has two authoritative formats for the same data* and the AGENTS.md "standard" isn't actually a standard yet.

Don't ship more character-related work until this is closed. Open gaps:

- [ ] **`backend/app/default_scene.branding.py`** — Claude + ChatGPT still inline in Python with ~80-line hardcoded role blocks. Migrate to `app/characters/claude/` + `app/characters/chatgpt/`, then collapse the file to a `_place()` composition like `default_scene.py`.

- [ ] **User-proposed characters (`POST /api/v1/scenes/propose`)** — `SceneProposalForm` writes raw `CharacterConfig` objects into `scene_configs.config` JSON. This is the *most-used* character-creation path and it bypasses the library entirely. Two design options:
    - **B1 — Filesystem write:** backend writes a new `data/characters/<slug>/AGENTS.md + .character.yaml` per proposal. Loader scans `app/characters/` (seeds, versioned) ∪ `data/characters/` (user, mounted volume). Needs slug-collision handling, write-from-request-handler safety, and a compose volume mount.
    - **B2 — DB-backed library row:** new `characters` table (id, name, color, sprite_id, visual, role_md, llm_*) — same logical shape as `.character.yaml` but stored in the DB. Loader reads from disk + DB and merges. No filesystem writes from the request path.

    Recommendation: **B1**, because it keeps the AGENTS.md file as the actual artifact and lets you `git diff` user-submitted characters. Bonus: a future "promote to seed" action is just `mv data/characters/<id> app/characters/<id>`.

- [ ] **DB schema slim — `scene_configs.config` references library ids instead of embedding character configs.** Today the JSON column stores the full `CharacterConfig` per character. Once the library is the SSOT, scenes should just store `dict[str, CharacterPlacement]` (id + initial_position/direction/action/mood). Hydration via `load_character(id)` happens on read. Backwards compat: keep the read-path tolerant of the old fat shape (Pydantic `extra="ignore"` already handles it for SceneState; same trick works here for SceneConfig if we wrap the read).

- [ ] **`backend/tests/fixtures.py:_make_char_config`** — builds CharacterConfig by hand, bypasses the library. Switch to `load_character("alice") / load_character("bob")` plus a `_place()` helper, so tests exercise the same path production uses.

- [ ] **Frontend Sprite dropdown → Character dropdown.** Phase 3 added a sprite-id picker per character. Once the library is canonical, propose-a-character can become "pick from library OR create new" — keeps users from re-defining bob differently each time, and the "create new" path is what triggers a write to `data/characters/`.

- [ ] **Standard discipline check.** `agents.md` is "standard Markdown, no required schema". `.character.yaml` is *our* convention next to it. Document the exact loader contract (which YAML keys are required, what happens on missing keys, slug rules) in `app/characters/README.md` so the library has a spec, not just five examples.

Estimated split: A (branding + tests + DB-read tolerance, fully backwards compat) in one commit, B+C (write path + schema slim) in a second. Don't bundle — the second one needs a DB migration.

## Execution log

Phases shipped in order: 0 → 1 → 2 → 3a → 4a → 5 → 6a → 7 → 8 → 9 → 4b → 6b, then substantive tests + quick-wins bundle. Commits `021f5dd` … `d567dcd`.

Post-modernization scene-content + UX + tech-refactor track: `08b4d5f` → `252b3ab` → `b119c26` → `1d47744` → `605dd19` → `b46b482` (character library — partial; see "Open: Character Library" above).
