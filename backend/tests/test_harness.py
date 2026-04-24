"""Harness unit tests.

Focus on the pure-logic pieces that don't need a running event loop or
the socket server: visitor tracking, next-speaker selection, scene-state
bookkeeping.
"""

from unittest.mock import AsyncMock

import pytest

from app.harness import Harness
from app.models.scene import Scene
from tests.fixtures import make_message


@pytest.fixture
def sm(scene: Scene) -> Harness:
    """Harness with its active scene pre-populated (skips DB load).

    Snapshot persistence is stubbed so visitor/action mutations don't
    hit the database in unit tests. Broadcast no longer lives on the
    Harness (it moved to ``app/client/socketio.py`` in Phase D), so
    there's nothing else to stub.
    """
    m = Harness()
    m.scene = scene
    m._persist_state = AsyncMock()  # type: ignore[method-assign]
    return m


class TestVisitorTracking:
    async def test_add_visitor_increments_count(self, sm: Harness):
        await sm.add_visitor("sid-1")
        assert sm.active_visitors == {"sid-1"}
        assert sm.scene is not None
        assert sm.scene.state.visitor_count == 1
        assert sm.scene.state.conversation_active is True

    async def test_remove_visitor_decrements_count(self, sm: Harness):
        await sm.add_visitor("sid-1")
        await sm.add_visitor("sid-2")
        await sm.remove_visitor("sid-1")
        assert sm.active_visitors == {"sid-2"}
        assert sm.scene is not None
        assert sm.scene.state.visitor_count == 1

    async def test_last_visitor_leaves_pauses_conversation(self, sm: Harness):
        await sm.add_visitor("sid-1")
        await sm.remove_visitor("sid-1")
        assert sm.scene is not None
        # No visitors → conversation paused (conversation_active toggles with count > 0)
        assert sm.scene.state.visitor_count == 0
        assert sm.scene.state.conversation_active is False


class TestNextSpeaker:
    def test_empty_conversation_starts_with_configured_character(self, sm: Harness):
        assert sm.scene is not None
        sm.scene.state.messages = []
        assert sm._get_next_speaker() == sm.scene.config.start_character_id == "alice"

    def test_alternates_from_last_speaker(self, sm: Harness):
        assert sm.scene is not None
        sm.scene.state.messages = [make_message("alice", "hi")]
        assert sm._get_next_speaker() == "bob"

        sm.scene.state.messages.append(make_message("bob", "hello"))
        assert sm._get_next_speaker() == "alice"

    def test_raises_without_scene(self):
        m = Harness()
        with pytest.raises(ValueError, match="Scene not found"):
            m._get_next_speaker()


class TestGetOtherCharacter:
    def test_returns_the_other_character_when_only_two(self, sm: Harness):
        assert sm._get_other_character("alice") == "bob"
        assert sm._get_other_character("bob") == "alice"

    def test_raises_without_scene(self):
        m = Harness()
        with pytest.raises(ValueError, match="Scene not found"):
            m._get_other_character("alice")


class TestMultiNPCNextSpeaker:
    """3+ character scenes use weighted choice biased against the most-recent
    speaker — natural rotation, not robotic alternation."""

    @pytest.fixture
    def harness(self, three_character_scene: Scene) -> Harness:
        m = Harness()
        m.scene = three_character_scene
        m._persist_state = AsyncMock()  # type: ignore[method-assign]
        return m

    def test_never_picks_last_speaker(self, harness: Harness):
        """Run many trials — last speaker is excluded by construction."""
        assert harness.scene is not None
        harness.scene.state.messages = [make_message("alice", "hi")]
        for _ in range(100):
            speaker = harness._get_next_speaker()
            assert speaker != "alice"
            assert speaker in {"bob", "doctor_1"}

    def test_three_chars_can_rotate_freely(self, harness: Harness):
        """Over many turns the candidate set shouldn't be deterministic."""
        import random

        assert harness.scene is not None
        random.seed(42)
        harness.scene.state.messages = [make_message("alice", "hi")]
        choices = {harness._get_next_speaker() for _ in range(50)}
        # With weighted random over {bob, doctor_1}, both should appear
        assert choices == {"bob", "doctor_1"}

    def test_speak_weight_recency_penalty(self, harness: Harness):
        """A character who just spoke gets a much lower weight than one
        who hasn't been heard recently."""
        assert harness.scene is not None
        harness.scene.state.messages = [
            make_message("alice", "first"),
            make_message("bob", "second"),
            make_message("doctor_1", "third"),
        ]
        # doctor_1 spoke most recently → lowest weight
        assert harness._speak_weight("doctor_1") < harness._speak_weight("bob")
        assert harness._speak_weight("bob") < harness._speak_weight("alice")

    def test_speak_weight_end_conversation_request_dampens(self, harness: Harness):
        """A character that requested end-of-conversation gets halved weight."""
        assert harness.scene is not None
        harness.scene.state.messages = []  # no recency penalty for any
        baseline = harness._speak_weight("bob")
        harness.scene.state.characters["bob"].end_conversation_requested = True
        damped = harness._speak_weight("bob")
        assert damped == pytest.approx(baseline * 0.5)

    def test_speak_weight_never_zero(self, harness: Harness):
        """Even worst-case (just spoke + end-requested) keeps a floor."""
        assert harness.scene is not None
        harness.scene.state.messages = [make_message("alice", "x")]
        harness.scene.state.characters["alice"].end_conversation_requested = True
        # Can't be picked anyway (last speaker excluded), but the weight
        # function must not return 0.0 for safety.
        assert harness._speak_weight("alice") > 0.0

    def test_two_char_scene_still_alternates(self, sm: Harness):
        """Backward compat: 2-char scenes hit the early-return shortcut and
        deterministically pick the only other character."""
        assert sm.scene is not None
        sm.scene.state.messages = [make_message("alice", "x")]
        for _ in range(20):
            assert sm._get_next_speaker() == "bob"


class TestSetVisitors:
    def test_active_when_visitors_present(self, sm: Harness):
        assert sm.scene is not None
        state = sm._set_visitors(3, sm.scene.state)
        assert state.visitor_count == 3
        assert state.conversation_active is True

    def test_paused_without_visitors(self, sm: Harness):
        assert sm.scene is not None
        state = sm._set_visitors(0, sm.scene.state)
        assert state.visitor_count == 0
        assert state.conversation_active is False


class TestStart:
    async def test_start_is_idempotent(self, sm: Harness):
        """Calling start() twice must not spawn a second tick task."""
        # Stub _load_and_run to a no-op so the fixture doesn't hit the DB.

        async def noop() -> None:
            return None

        sm._load_and_run = noop  # type: ignore[method-assign]
        sm.start()
        first = sm._loop_task
        sm.start()
        assert sm._loop_task is first
        # Clean up the scheduled task
        if first is not None:
            await first
