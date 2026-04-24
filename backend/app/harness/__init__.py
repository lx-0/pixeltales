"""Harness layer — owns the agentic loop.

The :class:`Harness` (per scene) drives turn-taking, paces character
output, persists snapshots, retries on transient errors, applies
fallbacks on sustained errors. Reads from :class:`World` to build
perception; writes Agent's output back to :class:`World`. Channel-
agnostic — does not know that Phaser exists.
"""

from app.harness.conversation import ConversationManager
from app.harness.orchestrator import Harness
from app.harness.scene_config_loader import SceneConfigService
from app.harness.scene_loader import SceneService

__all__ = [
    "ConversationManager",
    "Harness",
    "SceneConfigService",
    "SceneService",
]
