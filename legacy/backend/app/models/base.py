from typing import Literal
from pydantic import BaseModel


Direction = Literal["front", "right", "left", "back"]


class Position(BaseModel):
    """A position in the scene."""

    x: float
    y: float
