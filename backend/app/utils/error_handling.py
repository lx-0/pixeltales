from typing import Dict, List, Any, TypedDict
from pydantic import ValidationError


class ErrorDict(TypedDict):
    field: str
    message: str
    type: str
    context: Dict[str, Any]
    input: Any | None


def format_validation_errors(error: ValidationError) -> List[ErrorDict]:
    """Format validation errors into a more readable structure.

    Args:
        error: The ValidationError from pydantic

    Returns:
        A list of formatted error dictionaries with field, message, and context
    """
    formatted_errors: List[ErrorDict] = []
    for err in error.errors():
        location = " -> ".join(str(loc) for loc in err["loc"])
        formatted_errors.append(
            {
                "field": location,
                "message": err["msg"],
                "type": err["type"],
                "context": err.get("ctx", {}),
                "input": err.get("input", None),
            }
        )
    return formatted_errors
