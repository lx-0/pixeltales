"""Stub implementation for the `recall_about_npc` skill.

Real social-memory backend is on the wishlist (see ROADMAP). Today this
exists to prove the SKILL.md → @agent.tool registration path end to end.
"""


def recall_about_npc(npc_id: str) -> str:
    """Return what the agent recalls about another NPC, or a no-memory marker."""
    return f"(no memory of {npc_id} yet)"
