"""Skill loader tests + character `skills:` field validation.

Covers the agentskills.io SKILL.md format consumed by `app/agent/skills/`
and the Agent layer's tool-registration path.
"""

from pathlib import Path

import pytest
from pydantic import SecretStr

from app.agent import characters as character_loader
from app.agent import llm as llm_module
from app.agent.characters import load as real_load_character
from app.agent.skills import Skill, _parse_frontmatter, load_skill
from app.core import config as config_mod


@pytest.fixture(autouse=True)
def _reset_character_cache():
    character_loader._invalidate_cache()
    yield
    character_loader._invalidate_cache()


class TestSkillLoader:
    """The shipped `recall_about_npc` skill is the canary — if its load path
    works, the loader contract is solid."""

    def test_load_recall_about_npc_returns_skill(self):
        skill = load_skill("recall_about_npc")
        assert isinstance(skill, Skill)
        assert skill.name == "recall_about_npc"
        # Description is the LLM-facing tool description
        assert "recall facts" in skill.description.lower()
        assert callable(skill.callable)

    def test_load_recall_about_npc_callable_returns_no_memory_marker(self):
        skill = load_skill("recall_about_npc")
        # Stub returns "(no memory of <id> yet)" today
        result = skill.callable("bob")
        assert "no memory" in result
        assert "bob" in result

    def test_invalid_slug_rejected(self):
        with pytest.raises(ValueError, match="invalid skill name"):
            load_skill("Invalid-Caps")

    def test_missing_skill_dir_rejected(self):
        with pytest.raises(FileNotFoundError, match="skill not found"):
            load_skill("does_not_exist")


class TestFrontmatterParser:
    """The frontmatter parser is the contract for agentskills.io SKILL.md."""

    def test_valid_frontmatter_and_body(self, tmp_path: Path):
        raw = "---\nname: foo\ndescription: A foo skill\n---\nBody text here.\n"
        fm, body = _parse_frontmatter(raw, tmp_path / "x.md")
        assert fm == {"name": "foo", "description": "A foo skill"}
        assert body == "Body text here."

    def test_no_frontmatter_block_rejected(self, tmp_path: Path):
        with pytest.raises(ValueError, match="must start with a YAML frontmatter block"):
            _parse_frontmatter("Just body, no frontmatter\n", tmp_path / "x.md")

    def test_non_dict_frontmatter_rejected(self, tmp_path: Path):
        raw = "---\n- list_not_dict\n---\nbody"
        with pytest.raises(ValueError, match="frontmatter must be a YAML mapping"):
            _parse_frontmatter(raw, tmp_path / "x.md")


class TestCharacterSkillsField:
    """`skills:` flows through the character library loader."""

    def _write_minimal_character(self, base: Path, char_id: str, skills_block: str) -> Path:
        d = base / char_id
        d.mkdir(parents=True)
        (d / ".character.yaml").write_text(
            f"""id: {char_id}
name: TestChar
color: "#ABCDEF"
sprite_id: bob
visual: A test character with at least ten chars.
{skills_block}
llm:
  provider: openai
  model: gpt-4o-mini
""",
            encoding="utf-8",
        )
        (d / "AGENTS.md").write_text(
            "A test character with at least ten chars.\n", encoding="utf-8"
        )
        return d

    def test_omitted_skills_defaults_to_empty(self, tmp_path: Path):
        d = self._write_minimal_character(tmp_path, "noskills", "")
        identity = character_loader._load_one(d)
        assert identity.skills == []

    def test_skills_list_loaded(self, tmp_path: Path):
        d = self._write_minimal_character(tmp_path, "withskills", "skills:\n  - recall_about_npc")
        identity = character_loader._load_one(d)
        assert identity.skills == ["recall_about_npc"]

    def test_skills_must_be_list(self, tmp_path: Path):
        d = self._write_minimal_character(tmp_path, "badskills", "skills: not_a_list")
        with pytest.raises(ValueError, match="`skills` must be a list"):
            character_loader._load_one(d)


class TestSkillRegistration:
    """Skills attached to a character get registered as tools on the Agent.

    Uses the LLMManager.init_scene path with the real skill loader and the
    fixtures' Alice/Bob characters (which have empty skills today). To test
    the registration path, we manually inject a skill onto Alice's identity
    via monkeypatch — proving the wiring without touching the seed library.
    """

    async def test_init_scene_registers_skills_on_agent(
        self, monkeypatch: pytest.MonkeyPatch, scene
    ):
        """Patch the character library so Alice has the recall skill, then
        verify the resulting Agent exposes a tool with that name."""

        def patched_load(char_id: str):
            ident = real_load_character(char_id).model_copy()
            if char_id == "alice":
                ident = ident.model_copy(update={"skills": ["recall_about_npc"]})
            return ident

        monkeypatch.setattr(llm_module, "load_character", patched_load)
        # init_scene needs OPENAI_API_KEY (or gateway). The agent doesn't
        # actually call the API in this test.
        monkeypatch.setattr(
            config_mod.settings, "OPENAI_API_KEY", SecretStr("sk-test"), raising=False
        )

        manager = llm_module.LLMManager()
        manager.init_scene(scene.config)

        assert manager.agents is not None
        alice_agent = manager.agents["alice"]
        # PydanticAI Agent exposes registered tools via its toolset; the
        # public-ish surface is `_function_toolset` (1.x) which keeps the
        # Tool definitions. We assert by name match.
        tool_names = {t.name for t in alice_agent._function_toolset.tools.values()}
        assert "recall_about_npc" in tool_names

        bob_agent = manager.agents["bob"]
        bob_tool_names = {t.name for t in bob_agent._function_toolset.tools.values()}
        assert "recall_about_npc" not in bob_tool_names

    async def test_init_scene_with_no_skills_builds_clean_agent(
        self, monkeypatch: pytest.MonkeyPatch, scene
    ):
        """Backward compat: characters without `skills:` produce agents with
        zero registered tools (just the structured-output result tool)."""
        monkeypatch.setattr(
            config_mod.settings, "OPENAI_API_KEY", SecretStr("sk-test"), raising=False
        )
        manager = llm_module.LLMManager()
        manager.init_scene(scene.config)
        assert manager.agents is not None
        for agent in manager.agents.values():
            assert len(agent._function_toolset.tools) == 0
