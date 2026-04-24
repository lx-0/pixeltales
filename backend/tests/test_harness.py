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
