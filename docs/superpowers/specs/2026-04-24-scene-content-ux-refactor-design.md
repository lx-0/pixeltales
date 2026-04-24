# Scene Content + Visitor UX Polish + Tech Refactoring — Design

**Date:** 2026-04-24
**Status:** Draft, pending user approval
**Successor to:** Modernization phases 0-9 (see `ROADMAP.md`)

## Context

After shipping the modernization marathon (pnpm/Node 22, uv/Python 3.12, Biome, Tailwind 4, React 19, structlog, Alembic, slowapi, prometheus, OpenAPI + Socket typing, substantive tests), the next direction was brainstormed on 2026-04-24.

**Ruled out:** Resurrecting the V1 "agentic architecture" rewrite (branches `agentic-architecture` / `manni/init` / `turborepo`, and `.archive/agent-architecture.md`). The user marked these explicitly as a false turn — the Mind-Nachbildung approach is over-engineered for the product vision. The 5-stage "MVP Evolutions" (Frankenstein → Tamagotchi → Friend → Party → Society) in `.private/.notes/IDEAS.md` were tied to that architecture and are also dropped.

**In scope:** Evolving the current MVP pattern (2 AI chars chat in a pixel room, structured LLM output, visitors observe + vote + propose scenes). Three clusters selected:

- **(a) Visitor UX Polish — cautiously.** Small, low-risk UI refinements.
- **(b) Scene Content.** More variety: multiple character sprites, multiple rooms.
- **(e) Tech Refactoring.** Internal cleanup without user-visible behavior change.

Explicitly out of scope this iteration:
- Cluster (c) Visitor Engagement (Email, CSV, SSO, translation)
- Cluster (d) Platform / Distribution (Twitch, gather.town)
- Spritesheet Builder (huge multi-step LLM workflow — `[--]` rating in `PROMPTS.md`)
- LangGraph rewrite (Phase 3b from ROADMAP, gating met but not prioritized now)
- Phaser 4 (major upgrade)
- Real OAuth, hCaptcha, OTel traces, Bundle splitting

## Feature 1 — Dynamic Character Sprites

**Current state:** `CharacterManager.preload()` hardcodes Bob + Cleaner_girl sprite paths. `createAnimations()` iterates over `['bob', 'alice']` literal. Sprite key = character id. Adding a new character requires code changes.

**Desired state:** Sprite is a property of the scene's character config. Any sprite from a backend-served catalog can be picked per character.

**Assets available today** (copied into `frontend/public/assets/characters/` on 2026-04-24): Bob (animated + run), Cleaner_girl (animated + static), Doctor_1 (static), Doctor_2 (static), Zombie (static). Doctor + Zombie do not have idle animations — either wire a static-only code path or animate a single frame.

**Changes:**

1. **Backend asset catalog.** `app/config.py` exports `AVAILABLE_SPRITES: list[SpriteOption]` with `{id, name, path, has_idle_anim}`. Served via `GET /api/v1/config` alongside the existing `llm_providers` and `colors`.
2. **`CharacterConfig` field.** Add `sprite_id: str` (with `default="bob"` for backwards compat). Alembic autogenerate picks it up as a JSON-column addition inside `scene_configs.config`; no schema migration required because `characters_config` is already stored as JSON.
3. **`CharacterManager`.** Refactor `preload()` + `createAnimations()` to iterate over the actual `scene.characters` keys and their `sprite_id` + `has_idle_anim`. Use sprite_id as the Phaser asset key. When `has_idle_anim=false`, generate a single-frame pseudo-animation so `sprite.play(...)` still works.
4. **Scene-proposal form.** Add a sprite dropdown per character, populated from the `/config` response.

## Feature 2 — Dynamic Rooms

**Current state:** `MainScene` hardcodes the room background asset. Only `room.png` is rendered.

**Desired state:** Room is a property of `SceneConfig`, selectable at proposal time.

**Assets available today:** room, room2, the-lab, the-lab-w-docs (all PNG backgrounds in `public/assets/scenes/`). Tiled `.tmx` maps and tilesets exist in `.project/assets/` but are out of scope for this iteration (deferred until static-background coverage is insufficient).

**Changes:**

1. **Backend asset catalog.** `AVAILABLE_ROOMS: list[RoomOption]` with `{id, name, background_path}`. Served via `/config`.
2. **`SceneConfig` field.** Add `room_id: str = "room"`.
3. **`MainScene`.** Load the configured room background instead of the hardcoded path.
4. **Scene-proposal form.** Add a room dropdown.

## Feature 3 — UX Polish (cautiously)

Two items from `.private/.notes/PROMPTS.md` with the highest user ratings:

1. **V-align "is thinking" message** (`[++]`) — in `ConversationHistory`, the placeholder row for a character currently thinking has text alignment drift. Center-align vertically.
2. **Side-view toggle moves into `ConversationHistory` toolbar** (`[+]`) — currently a floating top-right button. Move it into the conversation history header as a toolbar button labeled "show below / beside game canvas".

Explicitly excluded from this iteration:
- Mobile orientational split-screen UI (`[o]`)
- Fullscreen mode (`[o]`)
- Rating-chart zoom (`[++]` — but more involved than the two above)

## Feature 4 — Tech Refactoring: SceneConfig out of SceneState snapshots

**Current state:** `SceneStateSnapshot` persists the full `SceneState` which duplicates fields already present in `SceneConfig` (character roles, colors, llm_configs, etc.). Snapshots grow with each tick.

**Desired state:** `SceneState` holds only runtime state (character positions, actions, messages, moods, visitor_count). `SceneConfig` stays separate and is referenced by `config_id` in snapshots — already the FK relation exists, but `SceneState.characters[*]` includes `CharacterConfig` fields redundantly.

**Changes:**

1. Split `CharacterState` into `CharacterState` (runtime only: position, direction, action, mood, ...) and leave `CharacterConfig` in `SceneConfig`.
2. `SceneState` snapshot no longer embeds character configs; only character ids + per-id runtime state.
3. Frontend: fetch config once per scene (already effectively true via `/scenes/{id}`), merge with state updates. Requires updating the socket-event shape.
4. Alembic migration: no DB schema change (JSON columns). But **old snapshots stay on the fat shape** — code must tolerate both on read, or we stamp a one-off data migration that strips redundant fields.

Risk: non-trivial. Gets its own commit.

## Out of Scope — Parked for Later

From `.private/.notes/PROMPTS.md` wishlist, not being touched this iteration but tracked for the future:

| Rating | Item |
|---|---|
| `[++]` | Zoom in/out on conversation rating chart |
| `[o]` | Proper context windowing |
| `[o]` | Conversation summary email to proposer |
| `[o]` | Download conversation summary as CSV / JSON (research-optimized dataset) |
| `[o]` | SSO (Google / GitHub) |
| `[o]` | Mobile orientational split-screen UI |
| `[o]` | Fullscreen mode (sticky btn in game canvas) |
| `[-]` | New Scene Templates (room templates = Tiled .tmx rendering) |
| `[--]` | Character Sprites Builder (multi-step LLM workflow) |
| `[--]` | Substitute PydanticAI for LangChain |
| `[--]` | Twitch streaming |
| `[--]` | Research gather.town features |

Open from ROADMAP `Open / Future Work`: LangGraph rewrite, DB-stored model config, shadcn refresh, Phaser 4, bundle splitting, `@/types/scene` sweep, OpenTelemetry, Coverage floors, Playwright in CI, Real OAuth, hCaptcha, workspace-CLAUDE.md fix, deploy-target docs.

## Execution Order

1. **Scene-Content backend** — asset catalog in `config.py`, `CharacterConfig.sprite_id`, `SceneConfig.room_id`, default-scene update, re-dump openapi.json, regenerate frontend types. One commit.
2. **Scene-Content frontend `CharacterManager` + `MainScene`** — dynamic preload + animation-generation + room-background. One commit.
3. **Scene-Content `SceneProposalForm`** — sprite + room dropdowns. One commit.
4. **UX-Polish** — v-align thinking-text + side-view-toggle move. One commit.
5. **Tech-Refactoring** — SceneState/SceneConfig split. One commit. Do this last so the earlier UX-Polish isn't tangled with the refactor.

Backend container rebuild after 1 and 5. Frontend hot-reload handles 2-4.

## Testing

- Backend unit tests: extend `test_scene_config_service` with a proposal that picks a non-default sprite + room. Verify persistence + retrieval.
- Frontend: no new tests required for UX polish. For `CharacterManager` dynamic loading, a `vitest` test would require Phaser mocks — defer. Manual smoke in browser (Playwright could cover later).

## Verification

- `pnpm check` + `pnpm build`
- `uv run pytest` (currently 30 passing)
- `uv run --no-sync ruff check` + `mypy app`
- Manual browser: propose a scene with Doctor_1 + Zombie in the-lab room, verify chars render, conversation flows, scene proposal in list shows correct metadata.

## Resolved Open Questions

- **Character-Sprite fallback for `has_idle_anim=false`** → single-frame "pseudo-animation": load as a 48×48 spritesheet with `endFrame: 0` and generate a 1-frame anim per direction so `sprite.play(...)` stays uniform. Implemented in `CharacterManager.preload()` + `createAnimations()` (`252b3ab`). Static sprites (Doctor_1, Doctor_2, Zombie) render visually shorter than animated ones (48 vs 96 px tall) — accepted for MVP, revisit if it bothers viewers.
- **Where to store the asset catalog** → kept in `backend/app/config.py` (`AVAILABLE_SPRITES`, `AVAILABLE_ROOMS`). Served via `GET /api/v1/config`. Extract to a JSON file only if a non-code contributor actually asks to add a sprite without touching Python.

## Status — Shipped 2026-04-24

All 5 features from the spec landed in order:

1. ✅ Scene-content backend (`08b4d5f`) — sprite + room asset catalog, `CharacterConfig.sprite_id`, `SceneConfig.room_id`
2. ✅ Scene-content frontend (`252b3ab`) — `CharacterManager` + `MainScene` dynamic preload, sprite_id as Phaser asset key, has_idle_anim fallback
3. ✅ `SceneProposalForm` dropdowns (`b119c26`) — sprite + room pickers
4. ✅ UX polish (`1d47744`) — items-baseline → items-center for "is thinking", Layout button moved into ConversationHistory header
5. ✅ SceneState/SceneConfig split (`605dd19`) — CharacterState slimmed; consumers join with sceneConfig in App.tsx

**Bonus track** (not in original spec, emerged from conversation):

6. Character library v1 (`b46b482`) — AGENTS.md + .character.yaml per character; loader in `app/characters/__init__.py`
7. Character library SSOT closure (`b9ddf22`) — gap-fix after user pushback; covers branding scene, scene-proposal write path, DB schema slim, tests, frontend form rework, GET/POST /characters endpoints, data/characters/ volume mount. See `app/characters/README.md` for the full library spec and `ROADMAP.md` "✅ Closed: Character Library" section for the gap inventory.

**Browser smoke test still pending** — needs `docker compose down -v && docker compose up --build` because of pyyaml dep + Pydantic model + compose volume changes.
