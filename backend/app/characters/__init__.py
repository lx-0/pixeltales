"""Character library loader.

Each subdirectory of this package is one character:

    bob/
    ├── AGENTS.md         # role / personality (free-form Markdown, agents.md spec)
    └── .character.yaml   # structured metadata (display name, color, sprite, llm)

`load_all()` walks the directory at import time, parses both files, and
returns `dict[str, CharacterIdentity]` keyed by id. Cached.
"""

from functools import cache
from pathlib import Path
from typing import Any

import yaml

from app.models.character import CharacterIdentity
from app.models.llm import LLMConfig

_LIBRARY_DIR = Path(__file__).parent
_AGENTS_FILE = "AGENTS.md"
_METADATA_FILE = ".character.yaml"


def _load_one(char_dir: Path) -> CharacterIdentity:
    """Load a single character from its folder."""
    metadata_path = char_dir / _METADATA_FILE
    agents_path = char_dir / _AGENTS_FILE
    if not metadata_path.exists():
        raise FileNotFoundError(f"missing {_METADATA_FILE} in {char_dir}")
    if not agents_path.exists():
        raise FileNotFoundError(f"missing {_AGENTS_FILE} in {char_dir}")

    raw: dict[str, Any] = yaml.safe_load(metadata_path.read_text(encoding="utf-8")) or {}
    llm_raw = raw.pop("llm", None)
    if not isinstance(llm_raw, dict):
        raise ValueError(f"{metadata_path}: missing or invalid `llm` block")

    role = agents_path.read_text(encoding="utf-8").rstrip("\n")

    return CharacterIdentity(
        id=raw["id"],
        name=raw["name"],
        color=raw["color"],
        sprite_id=raw["sprite_id"],
        visual=raw["visual"],
        role=role,
        llm_config=LLMConfig(
            provider=llm_raw["provider"],
            model_name=llm_raw["model"],
            temperature=float(llm_raw.get("temperature", 0.7)),
            max_tokens=int(llm_raw.get("max_tokens", 4096)),
        ),
    )


@cache
def load_all() -> dict[str, CharacterIdentity]:
    """Load every character in the library, keyed by id. Cached."""
    library: dict[str, CharacterIdentity] = {}
    for entry in sorted(_LIBRARY_DIR.iterdir()):
        if not entry.is_dir() or entry.name.startswith("_") or entry.name == "__pycache__":
            continue
        identity = _load_one(entry)
        library[identity.id] = identity
    return library


def load(character_id: str) -> CharacterIdentity:
    """Look up a single character by id."""
    library = load_all()
    if character_id not in library:
        raise KeyError(f"character not found in library: {character_id}")
    return library[character_id]
