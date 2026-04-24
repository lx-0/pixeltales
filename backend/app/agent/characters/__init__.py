"""Character library loader + writer.

Library is the single source of truth for character identity (name, color,
sprite, role prose, llm config). See README.md in this directory for the
full spec.

Two source directories are scanned:

- `app/agent/characters/`        — versioned seeds shipped with the repo
- `settings.CHARACTERS_DATA_DIR` — runtime dir for user-proposed characters
                                   (mounted as a volume in compose)

If a slug exists in both, the **seed wins** and a warning is logged.
"""

import re
from pathlib import Path
from threading import RLock
from typing import Any

import structlog
import yaml

from app.core.config import settings
from app.models.character import CharacterIdentity
from app.models.llm import LLMConfig

logger = structlog.get_logger(__name__)

_SEED_DIR = Path(__file__).parent
_AGENTS_FILE = "AGENTS.md"
_METADATA_FILE = ".character.yaml"
_SLUG_RE = re.compile(r"^[a-z][a-z0-9_\-]{0,49}$")
_REQUIRED_KEYS = {"id", "name", "color", "sprite_id", "visual"}
# `.character.yaml` `llm:` block accepts EITHER explicit (provider+model) OR
# a high-level `tier:` (gateway alias like "cheap"/"default"/"quality").
# When `tier` is set, the LLMConfig is built with provider="openai" and
# model_name=<tier>; the LiteLLM gateway resolves the actual upstream model.
# Tier requires LITELLM_BASE_URL+LITELLM_API_KEY at runtime; no startup
# check — surfaces as an OpenAI 404 if the gateway is not configured.
_LLM_EXPLICIT_KEYS = {"provider", "model"}
_OPTIONAL_LLM_KEYS = {"temperature", "max_tokens"}
_LLM_TIER_KEY = "tier"

# Cache + lock so writes invalidate without races. Tests reset via
# `_invalidate_cache()`.
_cache: dict[str, CharacterIdentity] | None = None
_cache_lock = RLock()


def _data_dir() -> Path:
    """Resolve the runtime data dir. Created lazily on first write."""
    p = Path(settings.CHARACTERS_DATA_DIR)
    if not p.is_absolute():
        # Resolve relative to backend/ (parents: characters→agent→app→backend)
        p = Path(__file__).resolve().parents[3] / p
    return p


def _validate_slug(slug: str) -> None:
    if not _SLUG_RE.match(slug):
        raise ValueError(
            f"invalid character id {slug!r}: must match {_SLUG_RE.pattern} "
            "(lowercase letter + up to 49 lowercase alphanumerics, underscores, or hyphens)"
        )


def _validate_yaml(path: Path, raw: dict[str, Any]) -> None:
    """Strict structural validation of `.character.yaml`. Loud failure beats
    silent skip — the library is small enough to keep correct.
    """
    keys = set(raw.keys())
    missing = _REQUIRED_KEYS - keys
    if missing:
        raise ValueError(f"{path}: missing required keys: {sorted(missing)}")

    extra = keys - _REQUIRED_KEYS - {"llm", "skills"}
    if extra:
        raise ValueError(f"{path}: unknown keys: {sorted(extra)}")

    skills_value = raw.get("skills", [])
    if not isinstance(skills_value, list) or not all(isinstance(s, str) for s in skills_value):
        raise ValueError(f"{path}: `skills` must be a list of strings")

    if "llm" not in raw:
        raise ValueError(f"{path}: missing required `llm` block")
    llm = raw["llm"]
    if not isinstance(llm, dict):
        raise ValueError(f"{path}: `llm` must be a mapping")
    llm_keys = set(llm.keys())

    has_tier = _LLM_TIER_KEY in llm_keys
    has_explicit = bool(_LLM_EXPLICIT_KEYS & llm_keys)
    if has_tier and has_explicit:
        raise ValueError(
            f"{path}: `llm` block has both `{_LLM_TIER_KEY}` and explicit "
            f"{sorted(_LLM_EXPLICIT_KEYS)} — use one or the other"
        )
    if not has_tier and not has_explicit:
        raise ValueError(
            f"{path}: `llm` block must set either `{_LLM_TIER_KEY}` or {sorted(_LLM_EXPLICIT_KEYS)}"
        )
    if has_tier:
        allowed = {_LLM_TIER_KEY} | _OPTIONAL_LLM_KEYS
        if not isinstance(llm[_LLM_TIER_KEY], str) or not llm[_LLM_TIER_KEY]:
            raise ValueError(f"{path}: `llm.{_LLM_TIER_KEY}` must be a non-empty string")
    else:
        explicit_missing = _LLM_EXPLICIT_KEYS - llm_keys
        if explicit_missing:
            raise ValueError(f"{path}: missing llm keys: {sorted(explicit_missing)}")
        allowed = _LLM_EXPLICIT_KEYS | _OPTIONAL_LLM_KEYS

    llm_extra = llm_keys - allowed
    if llm_extra:
        raise ValueError(f"{path}: unknown llm keys: {sorted(llm_extra)}")


def _load_one(char_dir: Path) -> CharacterIdentity:
    """Load and validate one character folder."""
    metadata_path = char_dir / _METADATA_FILE
    agents_path = char_dir / _AGENTS_FILE
    if not metadata_path.exists():
        raise FileNotFoundError(f"missing {_METADATA_FILE} in {char_dir}")
    if not agents_path.exists():
        raise FileNotFoundError(f"missing {_AGENTS_FILE} in {char_dir}")

    raw: dict[str, Any] = yaml.safe_load(metadata_path.read_text(encoding="utf-8")) or {}
    _validate_yaml(metadata_path, raw)

    if raw["id"] != char_dir.name:
        raise ValueError(
            f"{metadata_path}: id {raw['id']!r} does not match directory name {char_dir.name!r}"
        )
    _validate_slug(raw["id"])

    llm = raw["llm"]
    role = agents_path.read_text(encoding="utf-8").rstrip("\n")

    # Tier shorthand → gateway-routed OpenAI-compat call. Provider stays
    # "openai" because LiteLLM is OpenAI-compatible; gateway resolves the
    # tier alias to a real upstream model.
    if _LLM_TIER_KEY in llm:
        provider = "openai"
        model_name = llm[_LLM_TIER_KEY]
    else:
        provider = llm["provider"]
        model_name = llm["model"]

    return CharacterIdentity(
        id=raw["id"],
        name=raw["name"],
        color=raw["color"],
        sprite_id=raw["sprite_id"],
        visual=raw["visual"],
        role=role,
        skills=list(raw.get("skills", [])),
        llm_config=LLMConfig(
            provider=provider,
            model_name=model_name,
            temperature=float(llm.get("temperature", 0.7)),
            max_tokens=int(llm.get("max_tokens", 4096)),
        ),
    )


def _scan_dir(d: Path) -> dict[str, CharacterIdentity]:
    """Walk one source directory and return id→identity. Skips non-dirs and
    underscore-prefixed dirs (so __pycache__ etc. don't surface).
    """
    out: dict[str, CharacterIdentity] = {}
    if not d.exists():
        return out
    for entry in sorted(d.iterdir()):
        if not entry.is_dir() or entry.name.startswith(("_", ".")):
            continue
        identity = _load_one(entry)
        out[identity.id] = identity
    return out


def load_all() -> dict[str, CharacterIdentity]:
    """Scan seeds + data dir, merge with seed-wins. Cached."""
    global _cache
    with _cache_lock:
        if _cache is None:
            seeds = _scan_dir(_SEED_DIR)
            data = _scan_dir(_data_dir())
            merged = dict(data)
            for cid, ident in seeds.items():
                if cid in merged:
                    logger.warning(
                        "character.collision",
                        id=cid,
                        msg="seed shadows data character with the same id",
                    )
                merged[cid] = ident  # seed wins
            _cache = merged
        return _cache


def load(character_id: str) -> CharacterIdentity:
    """Look up a single character by id. Raises KeyError if missing."""
    library = load_all()
    if character_id not in library:
        raise KeyError(f"character not found in library: {character_id}")
    return library[character_id]


def write_character(identity: CharacterIdentity) -> Path:
    """Write a new character to the runtime data dir. Refuses to overwrite
    an existing character (in either source dir). Returns the directory path.
    """
    _validate_slug(identity.id)
    library = load_all()
    if identity.id in library:
        raise FileExistsError(f"character id {identity.id!r} already exists in library")

    char_dir = _data_dir() / identity.id
    char_dir.mkdir(parents=True, exist_ok=False)

    yaml_payload: dict[str, Any] = {
        "id": identity.id,
        "name": identity.name,
        "color": identity.color,
        "sprite_id": identity.sprite_id,
        "visual": identity.visual,
        "llm": {
            "provider": identity.llm_config.provider,
            "model": identity.llm_config.model_name,
            "temperature": identity.llm_config.temperature,
            "max_tokens": identity.llm_config.max_tokens,
        },
    }
    (char_dir / _METADATA_FILE).write_text(
        yaml.safe_dump(yaml_payload, sort_keys=False, allow_unicode=True),
        encoding="utf-8",
    )
    (char_dir / _AGENTS_FILE).write_text(identity.role.rstrip("\n") + "\n", encoding="utf-8")

    _invalidate_cache()
    return char_dir


def _invalidate_cache() -> None:
    """Drop the loaded library so the next `load_all()` re-scans both dirs.
    Test-friendly + called by `write_character`.
    """
    global _cache
    with _cache_lock:
        _cache = None
