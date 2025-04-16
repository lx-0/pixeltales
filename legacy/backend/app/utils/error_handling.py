from typing import Dict, List, Any, TypedDict
import logging
from pydantic import ValidationError

# Set up logger
logger = logging.getLogger(__name__)


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

    # Log the full error for debugging
    logger.error(f"Validation Error: {str(error)}")
    logger.error(f"Error details: {error.errors()}")

    for err in error.errors():
        # Create a readable location string
        location = " -> ".join(str(loc) for loc in err["loc"])

        # Format the error details with proper typing
        error_details: ErrorDict = {
            "field": location,
            "message": err["msg"],
            "type": err["type"],
            "context": err.get("ctx", {}),
            "input": err.get("input", None),
        }

        # Log each individual error
        logger.error(
            f"Validation error in field '{location}': {err['msg']} "
            f"(type: {err['type']}, input: {err.get('input', 'None')})"
        )

        formatted_errors.append(error_details)

    return formatted_errors
