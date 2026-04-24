# Character Library

Characters are the **single source of truth** for character identity (name, color, sprite, role prose, LLM config) in PixelTales. Every part of the system that needs identity — backend prompt assembly, LLM init, frontend rendering, scene proposals — reads from here.

This file is the spec the loader and writer enforce. If you're adding code that touches character identity, read this and obey it.

## Layout

Characters live in two directories. Both are scanned at boot:

- **`backend/app/agent/characters/`** — versioned seeds shipped with the repo (bob, alice, doctor_1, doctor_2, zombie, claude, chatgpt). Read-only at runtime.
- **`backend/data/characters/`** — user-proposed characters written by the backend at runtime via `POST /api/v1/characters`. Mounted as a docker volume so it survives container restarts.

If the same id exists in both, the **seed wins** and a warning is logged. (Promote a user character to a seed by `mv data/characters/<id> app/agent/characters/<id>` and committing.)

Every character is a directory:

```text
<id>/
├── AGENTS.md         # required: role / personality, free-form Markdown
└── .character.yaml   # required: structured metadata
```

## `.character.yaml` schema

All keys are required unless marked optional. Unknown keys are rejected (the loader validates strictly so typos surface immediately).

| Key                  | Type            | Notes                                                        |
| -------------------- | --------------- | ------------------------------------------------------------ |
| `id`                 | string          | Must equal the parent directory name. Slug rules below.      |
| `name`               | string (2-50)   | Display name. UTF-8 ok.                                      |
| `color`              | string          | Hex `#rrggbb`.                                               |
| `sprite_id`          | string          | Must exist in `AVAILABLE_SPRITES` (`GET /api/v1/config`).    |
| `visual`             | string (10-500) | One-sentence description used in system prompt.              |
| `llm.provider`       | string          | `openai` or `anthropic`.                                     |
| `llm.model`          | string          | Model id sent to the provider (e.g. `gpt-4o-mini`).          |
| `llm.temperature`    | float (0–2)     | Defaults to `0.7` if absent.                                 |
| `llm.max_tokens`     | int             | Defaults to `4096` if absent.                                |

## `AGENTS.md`

Free-form Markdown — no required structure, no frontmatter, no special headings. The entire body is concatenated into the LLM system prompt as the character's role.

Convention (not enforced): start with an `# H1` of the character's display name, then a one-liner identity sentence, then a `## Key traits` bullet list. The seed characters all follow this; the loader doesn't care.

The file follows the [agents.md](https://agents.md) spec — the same dot-md any coding agent would read for a project. The convention is that the file is human-editable prose targeted at an LLM "agent" (here: the LLM playing the character).

## Slug rules

The directory name is the character's `id`. It must:

- Match `^[a-z][a-z0-9_\-]{0,49}$` — lowercase ASCII letter + up to 49 more lowercase alphanumerics, underscores, or hyphens (50 chars total max, matches the `id` field constraints). Hyphens are accepted because the frontend `kebabCase` helper produces them; underscores stay supported because that's what most existing seeds (`doctor_1`, `doctor_2`) use.
- Equal the `id` field in `.character.yaml` exactly.
- Be unique across both seed and data directories (collisions resolved by seed-wins as above).

## Behavior on errors

The loader fails **loudly** at startup if any character is malformed (missing required key, schema mismatch, sprite_id not in catalog). PixelTales is small enough that "broken character → fix it" beats "skip and serve 80% of the library."

At runtime, `load(id)` raises `KeyError` if a scene references a character that's no longer in the library. Scene rendering should catch this and substitute a default placeholder identity rather than crash the whole tick.

## Programmatic API

```python
from app.agent.characters import load, load_all, write_character

load("bob")              # → CharacterIdentity, raises KeyError if missing
load_all()               # → dict[str, CharacterIdentity], cached, both dirs merged
write_character(ident)   # → writes data/characters/<id>/{AGENTS.md, .character.yaml}
                         #   raises FileExistsError on slug collision
```

`load_all()` is cached. After a `write_character()` the cache is invalidated so the new entry is visible immediately to subsequent `load()` calls.
