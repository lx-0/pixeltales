"""Tests for LLMManager.generate_response_stream.

Covers contract only: the method must yield CharacterResponse partials
from the underlying Agent.run_stream context manager. Real partial
validation behavior is pydantic-ai's responsibility.
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import pytest

from app.agent.llm import CharacterResponse, LLMManager
from app.models.llm import LLMConfig


def _make_partial(content: str | None) -> CharacterResponse:
    return CharacterResponse(
        recipient="bob",
        reaction_on_previous_message=None,
        conversation_rating=None,
        mood="curious",
        mood_emoji="🙂",
        thoughts="thinking...",
        content=content,
        end_conversation=False,
    )


class _FakeStreamedRunResult:
    def __init__(self, partials: list[CharacterResponse]) -> None:
        self._partials = partials

    async def stream_output(
        self, *, debounce_by: float | None = 0.1
    ) -> AsyncIterator[CharacterResponse]:
        for p in self._partials:
            yield p


class _FakeAgent:
    def __init__(self, partials: list[CharacterResponse]) -> None:
        self._partials = partials
        self.last_call: dict | None = None

    @asynccontextmanager
    async def run_stream(self, user_prompt: str, **kwargs) -> AsyncIterator[_FakeStreamedRunResult]:
        self.last_call = {"user_prompt": user_prompt, **kwargs}
        yield _FakeStreamedRunResult(self._partials)


@pytest.fixture
def stub_llm_manager() -> tuple[LLMManager, _FakeAgent]:
    """LLMManager wired to a fake Agent that emits a fixed partial sequence."""
    m = LLMManager()
    cfg = LLMConfig(provider="openai", model_name="gpt-4o-mini", max_tokens=512, temperature=0.7)
    partials = [
        _make_partial("Hel"),
        _make_partial("Hello"),
        _make_partial("Hello, Bob!"),
    ]
    fake = _FakeAgent(partials)
    m.agents = {"alice": fake}  # type: ignore[dict-item]
    m.character_configs = {"alice": cfg}
    m.system_prompt_template = "You are {character_name}. {input}"
    return m, fake


class TestGenerateResponseStream:
    async def test_yields_partials_in_order(
        self, stub_llm_manager: tuple[LLMManager, _FakeAgent]
    ) -> None:
        m, _ = stub_llm_manager
        system_vars = {
            "character_name": "Alice",
            "character_visual": "",
            "character_role": "",
            "message_recipient": "bob",
            "scene_description": "",
            "input": "Continue.",
            "conversation_length": "0",
            "current_time": "00:00",
        }
        collected: list[str | None] = []
        async for partial in m.generate_response_stream("alice", system_vars, []):
            collected.append(partial.content)
        assert collected == ["Hel", "Hello", "Hello, Bob!"]

    async def test_passes_user_prompt_and_instructions(
        self, stub_llm_manager: tuple[LLMManager, _FakeAgent]
    ) -> None:
        m, fake = stub_llm_manager
        system_vars = {
            "character_name": "Alice",
            "character_visual": "",
            "character_role": "",
            "message_recipient": "bob",
            "scene_description": "",
            "input": "Start a conversation.",
            "conversation_length": "0",
            "current_time": "00:00",
        }
        async for _ in m.generate_response_stream("alice", system_vars, []):
            pass
        assert fake.last_call is not None
        assert fake.last_call["user_prompt"] == "Start a conversation."
        assert fake.last_call["instructions"] == "You are Alice. Start a conversation."
        assert fake.last_call["message_history"] == []

    async def test_raises_without_init_scene(self) -> None:
        m = LLMManager()
        with pytest.raises(ValueError, match="init_scene not called"):
            async for _ in m.generate_response_stream("alice", {}, []):  # type: ignore[arg-type]
                pass

    async def test_last_yielded_partial_is_complete(
        self, stub_llm_manager: tuple[LLMManager, _FakeAgent]
    ) -> None:
        """The final partial is the canonical CharacterResponse for the turn."""
        m, _ = stub_llm_manager
        system_vars = {
            "character_name": "Alice",
            "character_visual": "",
            "character_role": "",
            "message_recipient": "bob",
            "scene_description": "",
            "input": "Continue.",
            "conversation_length": "0",
            "current_time": "00:00",
        }
        last: CharacterResponse | None = None
        async for partial in m.generate_response_stream("alice", system_vars, []):
            last = partial
        assert last is not None
        assert last.content == "Hello, Bob!"
        assert last.recipient == "bob"
        assert last.mood == "curious"
