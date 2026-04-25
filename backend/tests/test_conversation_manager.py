"""ConversationManager unit tests (no DB, mocked LLM)."""

from unittest.mock import AsyncMock

import pytest
from pydantic_ai.messages import (
    ModelRequest,
    ModelResponse,
    TextPart,
    UserPromptPart,
)

from app.agent.characters import load as load_character
from app.agent.llm import LLMManager
from app.harness.conversation import FALLBACK_TEMPLATES, ConversationManager
from app.models.scene import Scene
from tests.fixtures import make_message


def test_init_conversation_defaults_to_empty(mock_llm_manager: LLMManager):
    cm = ConversationManager(mock_llm_manager)
    cm.init_conversation()
    assert cm.conversation is not None
    assert cm.conversation.messages == []


def test_init_conversation_accepts_prior_messages(mock_llm_manager: LLMManager):
    cm = ConversationManager(mock_llm_manager)
    prior = [make_message("alice", "hi"), make_message("bob", "hello")]
    cm.init_conversation(prior)
    assert cm.conversation is not None
    assert len(cm.conversation.messages) == 2


def test_end_conversation_request_validity_is_three_minutes(
    mock_llm_manager: LLMManager,
):
    cm = ConversationManager(mock_llm_manager)
    # 3 minutes = 180s — documented contract, regression guard
    assert cm.get_end_conversation_request_validity() == 180.0


class TestSpeakingTime:
    """base_speaking_time (5s) + message_length * char_speaking_time (0.05s/char)."""

    def test_empty_message(self, mock_llm_manager: LLMManager):
        cm = ConversationManager(mock_llm_manager)
        assert cm._calculate_speaking_time(0) == pytest.approx(5.0)

    def test_short_message(self, mock_llm_manager: LLMManager):
        cm = ConversationManager(mock_llm_manager)
        # 20 chars → 5.0 + 20 * 0.05 = 6.0
        assert cm._calculate_speaking_time(20) == pytest.approx(6.0)

    def test_long_message(self, mock_llm_manager: LLMManager):
        cm = ConversationManager(mock_llm_manager)
        # 200 chars → 5.0 + 10.0 = 15.0
        assert cm._calculate_speaking_time(200) == pytest.approx(15.0)


class TestConversationHistory:
    """_prepare_conversation_history maps own messages to ModelResponse,
    others to ModelRequest."""

    def test_own_messages_are_assistant(self, mock_llm_manager: LLMManager):
        cm = ConversationManager(mock_llm_manager)
        cm.init_conversation(
            [
                make_message("alice", "hi"),
                make_message("bob", "hello"),
                make_message("alice", "how are you"),
            ]
        )
        history = cm._prepare_conversation_history("alice")
        assert len(history) == 3
        assert isinstance(history[0], ModelResponse)  # alice's "hi"
        assert isinstance(history[1], ModelRequest)  # bob's "hello"
        assert isinstance(history[2], ModelResponse)  # alice's "how are you"
        # Spot-check parts contain the expected content
        assert isinstance(history[0].parts[0], TextPart)
        assert history[0].parts[0].content == "hi"
        assert isinstance(history[1].parts[0], UserPromptPart)
        assert history[1].parts[0].content == "hello"

    def test_context_window_truncates(self, mock_llm_manager: LLMManager):
        cm = ConversationManager(mock_llm_manager)
        msgs = [make_message("alice" if i % 2 == 0 else "bob", f"msg {i}") for i in range(50)]
        cm.init_conversation(msgs)
        history = cm._prepare_conversation_history("alice")
        # Only the last `context_window` (20) messages are kept
        assert len(history) == cm.context_window == 20

    def test_empty_content_becomes_ellipsis(self, mock_llm_manager: LLMManager):
        cm = ConversationManager(mock_llm_manager)
        cm.init_conversation([make_message("alice", "")])
        history = cm._prepare_conversation_history("alice")
        # alice speaks → ModelResponse(TextPart)
        assert isinstance(history[0], ModelResponse)
        part = history[0].parts[0]
        assert isinstance(part, TextPart)
        assert part.content == "..."

    def test_raises_without_init(self, mock_llm_manager: LLMManager):
        cm = ConversationManager(mock_llm_manager)
        with pytest.raises(ValueError, match="Conversation not set"):
            cm._prepare_conversation_history("alice")


class TestSystemMessage:
    def test_contains_character_vars(self, mock_llm_manager: LLMManager, scene: Scene):
        cm = ConversationManager(mock_llm_manager)
        vars = cm._prepare_system_message(scene, "alice", message_recipient="bob")
        assert vars["character_name"] == "Alice"
        role = vars["character_role"]
        # Role now comes from app/agent/characters/alice/AGENTS.md (the library);
        # verify identity flowed through, not the exact prose.
        assert isinstance(role, str)
        assert "Alice" in role
        assert vars["message_recipient"] == "bob"

    def test_input_differs_for_empty_vs_ongoing_conversation(
        self, mock_llm_manager: LLMManager, scene: Scene
    ):
        cm = ConversationManager(mock_llm_manager)
        empty = cm._prepare_system_message(scene, "alice")
        assert "Start a conversation" in empty["input"]

        scene.state.messages.append(make_message("alice", "hi"))
        ongoing = cm._prepare_system_message(scene, "alice")
        assert "Continue" in ongoing["input"]


class TestGenerateMessage:
    async def test_returns_message_from_llm_response(
        self, mock_llm_manager: LLMManager, scene: Scene
    ):
        cm = ConversationManager(mock_llm_manager)
        cm.init_conversation()
        msg = await cm.generate_message(scene, "alice", recipient="bob")
        assert msg.character == "alice"
        assert msg.content == "Hello, Bob! How are you today?"
        assert msg.mood == "curious"
        # Speaking time calculated from content length
        assert msg.calculated_speaking_time == pytest.approx(
            cm._calculate_speaking_time(len(msg.content or ""))
        )

    async def test_retries_on_llm_error_then_succeeds(
        self, mock_llm_manager: LLMManager, scene: Scene
    ):
        cm = ConversationManager(mock_llm_manager)
        cm.init_conversation()
        cm.base_speaking_time = 0  # speed up
        # Fail once, then succeed with the default return_value
        original = mock_llm_manager.generate_response.return_value  # type: ignore[attr-defined]
        mock_llm_manager.generate_response = AsyncMock(  # type: ignore[method-assign]
            side_effect=[RuntimeError("boom"), original]
        )
        msg = await cm.generate_message(scene, "alice")
        assert msg.character == "alice"
        assert mock_llm_manager.generate_response.call_count == 2

    async def test_returns_fallback_after_max_retries(
        self, mock_llm_manager: LLMManager, scene: Scene
    ):
        cm = ConversationManager(mock_llm_manager)
        cm.init_conversation()
        cm.base_speaking_time = 0  # speed up backoff sleeps
        mock_llm_manager.generate_response = AsyncMock(  # type: ignore[method-assign]
            side_effect=RuntimeError("always fails")
        )
        msg = await cm.generate_message(scene, "alice", recipient="bob")
        # 3 retries = 3 calls
        assert mock_llm_manager.generate_response.call_count == 3
        # Fallback message keeps the scene alive
        assert msg.character == "alice"
        assert msg.recipient == "bob"
        assert msg.end_conversation is False
        assert msg.content is not None
        # Content matches one of the templates, with the character's display name
        alice_name = load_character("alice").name
        expected = {tpl.format(name=alice_name) for tpl in FALLBACK_TEMPLATES}
        assert msg.content in expected

    async def test_fallback_message_recipient_defaults_to_empty(
        self, mock_llm_manager: LLMManager, scene: Scene
    ):
        cm = ConversationManager(mock_llm_manager)
        cm.init_conversation()
        cm.base_speaking_time = 0
        mock_llm_manager.generate_response = AsyncMock(  # type: ignore[method-assign]
            side_effect=RuntimeError("always fails")
        )
        msg = await cm.generate_message(scene, "alice")
        assert msg.recipient == ""
