"""Loader tests for the `tier:` shorthand in `.character.yaml`.

Tier is a high-level alias resolved by the LiteLLM gateway (cheap/default/
quality/etc). When set, the loader builds an LLMConfig with provider="openai"
and model_name=<tier>; the `provider`/`model` keys are forbidden alongside.
"""

from pathlib import Path

import pytest

from app.agent import characters as character_loader


@pytest.fixture(autouse=True)
def _reset_cache():
    character_loader._invalidate_cache()
    yield
    character_loader._invalidate_cache()


def _write_character(
    base: Path,
    char_id: str,
    llm_block: str,
    *,
    role: str = "A test character with at least ten chars.",
) -> Path:
    """Build a minimal valid character folder with a custom `llm:` block."""
    char_dir = base / char_id
    char_dir.mkdir(parents=True)
    (char_dir / ".character.yaml").write_text(
        f"""id: {char_id}
name: TestChar
color: "#ABCDEF"
sprite_id: bob
visual: A test character with at least ten chars.
llm:
{llm_block}
""",
        encoding="utf-8",
    )
    (char_dir / "AGENTS.md").write_text(role + "\n", encoding="utf-8")
    return char_dir


def _scan_one(char_dir: Path):
    """Bypass cache: directly load one folder."""
    return character_loader._load_one(char_dir)


class TestTierLoader:
    def test_tier_resolves_to_openai_provider(self, tmp_path: Path):
        char_dir = _write_character(tmp_path, "tiertest", "  tier: cheap")
        identity = _scan_one(char_dir)
        assert identity.llm_config.provider == "openai"
        assert identity.llm_config.model_name == "cheap"

    def test_tier_with_optional_temperature_and_max_tokens(self, tmp_path: Path):
        char_dir = _write_character(
            tmp_path, "tiertest2", "  tier: quality\n  temperature: 0.3\n  max_tokens: 2048"
        )
        identity = _scan_one(char_dir)
        assert identity.llm_config.model_name == "quality"
        assert identity.llm_config.temperature == 0.3
        assert identity.llm_config.max_tokens == 2048

    def test_tier_and_explicit_provider_rejected(self, tmp_path: Path):
        char_dir = _write_character(
            tmp_path,
            "tiertest3",
            "  tier: cheap\n  provider: openai\n  model: gpt-4o-mini",
        )
        with pytest.raises(ValueError, match="both `tier` and explicit"):
            _scan_one(char_dir)

    def test_neither_tier_nor_explicit_rejected(self, tmp_path: Path):
        char_dir = _write_character(tmp_path, "tiertest4", "  temperature: 0.7")
        with pytest.raises(ValueError, match="must set either"):
            _scan_one(char_dir)

    def test_tier_must_be_non_empty_string(self, tmp_path: Path):
        char_dir = _write_character(tmp_path, "tiertest5", "  tier: ''")
        with pytest.raises(ValueError, match="must be a non-empty string"):
            _scan_one(char_dir)

    def test_explicit_provider_model_still_works(self, tmp_path: Path):
        """Backward-compat: existing characters with explicit provider+model."""
        char_dir = _write_character(
            tmp_path, "tiertest6", "  provider: openai\n  model: gpt-4o-mini"
        )
        identity = _scan_one(char_dir)
        assert identity.llm_config.provider == "openai"
        assert identity.llm_config.model_name == "gpt-4o-mini"

    def test_unknown_llm_key_with_tier_rejected(self, tmp_path: Path):
        char_dir = _write_character(tmp_path, "tiertest7", "  tier: cheap\n  bogus: value")
        with pytest.raises(ValueError, match=r"unknown llm keys.*bogus"):
            _scan_one(char_dir)

    def test_explicit_missing_model_rejected(self, tmp_path: Path):
        """provider alone without model is incomplete (and not tier)."""
        char_dir = _write_character(tmp_path, "tiertest8", "  provider: openai")
        with pytest.raises(ValueError, match=r"missing llm keys.*model"):
            _scan_one(char_dir)
