from pydantic import BaseModel, ConfigDict


class Message(BaseModel):
    """A message in the conversation."""

    model_config = ConfigDict(extra="forbid")

    character: str  # message sender (characterId)
    content: str | None = None
    recipient: str  # sender's free-form label for the recipient
    thoughts: str
    mood: str  # Free-form mood description
    mood_emoji: str  # Matching emoji for the mood
    reaction_on_previous_message: str | None = None
    timestamp: str  # ISO format datetime
    unix_timestamp: float  # Unix timestamp (Epoch time)
    calculated_speaking_time: float  # seconds
    conversation_rating: int | None = None
    end_conversation: bool


class Conversation(BaseModel):
    """A conversation."""

    messages: list[Message]
