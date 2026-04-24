---
name: recall_about_npc
description: Recall facts you've previously learned about another character (their personality traits, things they've told you, history together). Use when you mention or think about someone you've met before. Returns a short string summary, or "(no memory yet)" if you have nothing on file.
---

# When to use

Call this whenever your turn touches another NPC by name and you'd benefit
from continuity — e.g. "Bob mentioned he's afraid of spiders" should be
recall-able next time you talk to or about Bob.

# Parameters

- `npc_id` (str): the library id of the NPC you're recalling about (e.g. `"bob"`,
  `"alice"`).

# Returns

A short string. Stub today: returns `"(no memory of <id> yet)"`. The real
implementation depends on social-memory persistence (see ROADMAP wishlist
"Social memory / relationship tracking") — once that ships, this skill will
read from the per-NPC PARA store.
