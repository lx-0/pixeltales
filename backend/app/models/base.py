from typing import Literal

from pydantic import BaseModel, ConfigDict

Direction = Literal["front", "right", "left", "back"]


class Position(BaseModel):
    """A position in the scene."""

    model_config = ConfigDict(extra="forbid")

    x: float
    y: float
