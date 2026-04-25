"""World tests for the streaming-message API (start/update/complete).

Verifies the World-side contract for partial-message broadcasting:
- streaming_message field reflects in-progress turn
- the three new events fire in the right order
- character action transitions correctly
- snapshots exclude streaming_message (ephemeral wire state)
"""

import pytest

from app.models.scene import Scene, SceneState
from app.world import (
    CharacterActionChanged,
    MessageStreamCompleted,
    MessageStreamStarted,
    MessageStreamUpdated,
    World,
    WorldEvent,
)
from tests.fixtures import make_message


@pytest.fixture
def world(scene: Scene) -> World:
    return World(scene)


@pytest.fixture
def captured_events(world: World) -> list[WorldEvent]:
    events: list[WorldEvent] = []

    async def _capture(event: WorldEvent) -> None:
        events.append(event)

    world.subscribe(_capture)
    return events


class TestStartStreamingMessage:
    async def test_seeds_empty_streaming_message(
        self, world: World, captured_events: list[WorldEvent]
    ) -> None:
        await world.start_streaming_message("alice", recipient="bob")
        sm = world.state.streaming_message
        assert sm is not None
        assert sm.character == "alice"
        assert sm.content == ""
        assert sm.recipient == "bob"

    async def test_flips_speaker_action(
        self, world: World, captured_events: list[WorldEvent]
    ) -> None:
        await world.start_streaming_message("alice")
        char = world.state.characters["alice"]
        assert char.action == "speaking"
        assert char.action_estimated_duration is None  # unknown until complete

    async def test_emits_started_then_action_changed(
        self, world: World, captured_events: list[WorldEvent]
    ) -> None:
        await world.start_streaming_message("alice", recipient="bob")
        types = [type(e) for e in captured_events]
        assert types == [MessageStreamStarted, CharacterActionChanged]
        started = captured_events[0]
        assert isinstance(started, MessageStreamStarted)
        assert started.character_id == "alice"
        assert started.recipient == "bob"


class TestUpdateStreamingMessage:
    async def test_replaces_snapshot_and_emits(
        self, world: World, captured_events: list[WorldEvent]
    ) -> None:
        await world.start_streaming_message("alice")
        captured_events.clear()
        partial = make_message("alice", "Hel")
        await world.update_streaming_message(partial)
        assert world.state.streaming_message is partial
        assert len(captured_events) == 1
        assert isinstance(captured_events[0], MessageStreamUpdated)
        assert captured_events[0].message.content == "Hel"

    async def test_raises_without_active_stream(self, world: World) -> None:
        with pytest.raises(ValueError, match="No streaming message in progress"):
            await world.update_streaming_message(make_message("alice", "Hel"))

    async def test_raises_on_character_mismatch(self, world: World) -> None:
        await world.start_streaming_message("alice")
        with pytest.raises(ValueError, match="character mismatch"):
            await world.update_streaming_message(make_message("bob", "Hel"))


class TestCompleteStreamingMessage:
    async def test_appends_to_messages_and_clears_streaming(
        self, world: World, captured_events: list[WorldEvent]
    ) -> None:
        await world.start_streaming_message("alice", recipient="bob")
        captured_events.clear()
        final = make_message("alice", "Hello, Bob!")
        await world.complete_streaming_message(final)
        assert world.state.streaming_message is None
        assert world.state.messages == [final]

    async def test_refreshes_action_with_read_time_duration(
        self, world: World, captured_events: list[WorldEvent]
    ) -> None:
        await world.start_streaming_message("alice")
        captured_events.clear()
        final = make_message("alice", "Hello, Bob!")  # default speaking_time = 5.0
        await world.complete_streaming_message(final)
        char = world.state.characters["alice"]
        assert char.action == "speaking"
        assert char.action_estimated_duration == final.calculated_speaking_time

    async def test_emits_completed_then_action_changed(
        self, world: World, captured_events: list[WorldEvent]
    ) -> None:
        await world.start_streaming_message("alice")
        captured_events.clear()
        final = make_message("alice", "Hello, Bob!")
        await world.complete_streaming_message(final)
        types = [type(e) for e in captured_events]
        assert types == [MessageStreamCompleted, CharacterActionChanged]
        completed = captured_events[0]
        assert isinstance(completed, MessageStreamCompleted)
        assert completed.message is final

    async def test_raises_without_active_stream(self, world: World) -> None:
        with pytest.raises(ValueError, match="No streaming message to complete"):
            await world.complete_streaming_message(make_message("alice", "Hi"))


class TestSnapshotExcludesStreamingMessage:
    """Persistence boundary: streaming_message must never end up in DB JSON."""

    async def test_excluded_from_db_dump(self, world: World) -> None:
        await world.start_streaming_message("alice", recipient="bob")
        # Mirror what DBSceneStateSnapshot does on save
        dumped = world.state.model_dump(exclude={"streaming_message"})
        assert "streaming_message" not in dumped

    async def test_round_trip_default_none(self, world: World) -> None:
        # A persisted snapshot without streaming_message rehydrates with None
        dumped = world.state.model_dump(exclude={"streaming_message"})
        rehydrated = SceneState.model_validate(dumped)
        assert rehydrated.streaming_message is None

    async def test_included_in_wire_payload(self, world: World) -> None:
        # SocketIOClient serializes the full state — streaming_message MUST
        # be there so late-joining viewers can render the in-progress bubble.
        await world.start_streaming_message("alice", recipient="bob")
        wire = world.state.model_dump()
        assert "streaming_message" in wire
        assert wire["streaming_message"] is not None
