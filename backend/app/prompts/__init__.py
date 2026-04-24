"""Prompt template loader.

Each `.md` file in this directory is a named prompt template available as
`load("name")`. Cached on first read.
"""

from functools import cache
from pathlib import Path

_PROMPTS_DIR = Path(__file__).parent


@cache
def load(name: str) -> str:
    """Load a named prompt template (e.g. `load("system")` → system.md)."""
    path = _PROMPTS_DIR / f"{name}.md"
    if not path.exists():
        raise FileNotFoundError(f"prompt template not found: {path}")
    return path.read_text(encoding="utf-8").rstrip("\n")
