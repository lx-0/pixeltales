from typing import List, Optional
from pydantic import BaseModel

#
# Scene
# - List[Character]
# - List[Conversation]
#   - List[Participant]
#   - List[Message]
#
#


class Message(BaseModel):
    """A message in the conversation."""

    character: str  # message sender (characterId)
    content: Optional[str] = None
    recipient: str  # sender's free-form label for the recipient
    thoughts: str
    mood: str  # Free-form mood description
    mood_emoji: str  # Matching emoji for the mood
    reaction_on_previous_message: Optional[str] = None
    timestamp: str  # ISO format datetime
    unix_timestamp: float  # Unix timestamp (Epoch time)
    calculated_speaking_time: float  # seconds
    conversation_rating: Optional[int] = None
    end_conversation: bool


class Conversation(BaseModel):
    """A conversation."""

    messages: List[Message]
