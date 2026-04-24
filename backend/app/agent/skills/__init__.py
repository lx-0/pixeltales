"""Skill library — agentskills.io SKILL.md folders the Agent layer can
register as PydanticAI tools.

Layout per skill (per the open agentskills.io spec):

    app/agent/skills/<skill_name>/
      ├── SKILL.md     # required: frontmatter (name, description) + instructions body
      ├── tool.py      # required (this engine): exports a callable named <skill_name>
      └── __init__.py  # required so it imports as a package

Skills are listed by name in `.character.yaml` `skills: [recall_about_npc]`.
The character library's loader passes those through to `CharacterIdentity.skills`,
and `LLMManager._build_agent` registers each as a PydanticAI tool with the
SKILL.md description as the LLM-facing tool description.

The `tool.py` callable signature determines the tool's parameter schema —
PydanticAI inspects type hints. Keep callables sync or async; both are
supported by `Agent.tool_plain`.
"""

import importlib
import re
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml

_SKILLS_DIR = Path(__file__).parent
_SKILL_FILE = "SKILL.md"
_TOOL_FILE = "tool.py"
_SLUG_RE = re.compile(r"^[a-z][a-z0-9_]{0,49}$")
_REQUIRED_FRONTMATTER = {"name", "description"}


@dataclass(frozen=True)
class Skill:
    """A loaded skill — metadata + the callable to register on an Agent."""

    name: str
    description: str
    instructions: str
    callable: Callable[..., Any]


_FRONTMATTER_RE = re.compile(r"^---\n(.+?)\n---\n?(.*)$", re.DOTALL)


def _parse_frontmatter(raw: str, path: Path) -> tuple[dict[str, Any], str]:
    """Split a SKILL.md into (yaml-frontmatter dict, body string)."""
    match = _FRONTMATTER_RE.match(raw)
    if not match:
        raise ValueError(f"{path}: SKILL.md must start with a YAML frontmatter block (--- … ---)")
    fm_raw, body = match.group(1), match.group(2)
    try:
        fm = yaml.safe_load(fm_raw) or {}
    except yaml.YAMLError as e:
        raise ValueError(f"{path}: SKILL.md frontmatter is not valid YAML: {e}") from e
    if not isinstance(fm, dict):
        raise ValueError(f"{path}: SKILL.md frontmatter must be a YAML mapping")
    return fm, body.strip()


def load_skill(skill_name: str) -> Skill:
    """Load one skill by folder name. Raises ValueError on any inconsistency."""
    if not _SLUG_RE.match(skill_name):
        raise ValueError(f"invalid skill name {skill_name!r}: must match {_SLUG_RE.pattern}")

    skill_dir = _SKILLS_DIR / skill_name
    skill_md = skill_dir / _SKILL_FILE
    tool_py = skill_dir / _TOOL_FILE

    if not skill_dir.is_dir():
        raise FileNotFoundError(f"skill not found: {skill_dir}")
    if not skill_md.exists():
        raise FileNotFoundError(f"missing {_SKILL_FILE} in {skill_dir}")
    if not tool_py.exists():
        raise FileNotFoundError(f"missing {_TOOL_FILE} in {skill_dir}")

    fm, body = _parse_frontmatter(skill_md.read_text(encoding="utf-8"), skill_md)
    missing = _REQUIRED_FRONTMATTER - set(fm.keys())
    if missing:
        raise ValueError(f"{skill_md}: SKILL.md frontmatter missing keys: {sorted(missing)}")
    if fm["name"] != skill_name:
        raise ValueError(
            f"{skill_md}: SKILL.md frontmatter `name: {fm['name']!r}` does not match "
            f"folder name {skill_name!r}"
        )

    mod = importlib.import_module(f"app.agent.skills.{skill_name}.tool")
    fn = getattr(mod, skill_name, None)
    if fn is None or not callable(fn):
        raise AttributeError(
            f"{tool_py}: must export a callable named `{skill_name}` matching the skill folder"
        )

    return Skill(
        name=fm["name"],
        description=str(fm["description"]),
        instructions=body,
        callable=fn,
    )
