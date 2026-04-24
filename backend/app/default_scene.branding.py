from app.config import TILE_SIZE
from app.models.base import Position
from app.models.llm import LLMConfig
from app.models.scene import (
    CharacterConfig,
    CreateSceneConfig,
    SceneConfigStatus,
)

# from app.core.config import settings

# Default scene configuration

characters: dict[str, CharacterConfig] = {
    "bob": CharacterConfig(
        id="bob",
        name="Claude",
        color="#4A90E2",  # Professional blue
        role="""You are Claude.
Discuss the last conversation:
```
# AI Consulting Business Branding Discussion Summary

## Initial Context
- Developing branding for a new AI consulting business
- Key focus: Partnership over authority
- Moving away from corporate tech aesthetics (IBM, Accenture, Microsoft)
- Inspiration: High school project week atmosphere at gymnasium
- Design direction: Mixed media collage approach

## Brand Positioning Goals
- Approachable and creative
- Partner-level engagement vs authority
- Avoiding corporate jargon and technical buzzwords
- Bold but relatable
- Emphasis on collaboration and co-creation

## Naming Journey Evolution

### Initial Approaches
1. German-inspired words
   - Rejected for feeling like "dad jokes"
   - Too obvious/overdone in recent years

2. Artificial words
   - Felt too contrived and manufactured
   - Lacked authentic connection

3. Real words with symbolism
   - Many felt overused or too leadership-focused
   - Example: "Beacon" rejected for implying authority

### Name Evaluation Criteria (0-5 scale)
- Relatability: Easy to connect with and remember
- Positive Emotion: Feelings and associations
- Simplicity: Clarity and straightforwardness
- Uniqueness: Distinctiveness in tech space
- Brand Alignment: Fit with collaborative approach

### Top Scoring Names
1. Splice (21/25)
   - High brand alignment
   - Strong simplicity score
   - Suggests creative combination

2. Echo, Weave, Drift, Mesh (20/25)
   - All balanced across criteria
   - Strong in simplicity and brand alignment
   - Avoid hierarchical implications

## Key Insights
- Single, short words tend to work better
- Names should feel discovered rather than manufactured
- Avoid overly technical or leadership-implying terms
- Success in balancing uniqueness with approachability
- Importance of leaving room for brand growth and interpretation

## Design Direction
- Mixed media collage aesthetic
- Bold but not corporate
- Room for creative expression
- Emphasis on human touch and collaboration
- Avoiding polished, corporate feel

This evolution shows a clear movement from more conventional naming approaches toward something that better reflects the business's collaborative, non-hierarchical ethos while maintaining professionalism and creativity.
```""",
        # - You can only communicate in and understand in German language. No other languages - except the language of love :).
        visual="You are Claude.",
        llm_config=LLMConfig(
            provider="anthropic",
            model_name="claude-3-5-sonnet-20241022",
            temperature=0.7,
            max_tokens=4096,
        ),
        initial_position=Position(
            x=TILE_SIZE * 7.5,
            y=TILE_SIZE * 7.5,
        ),
        initial_direction="right",
        initial_action="idle",
        initial_mood="neutral",
    ),
    "alice": CharacterConfig(
        id="alice",
        name="ChatGPT",
        color="#E24A8F",  # Professional pink
        role="""You are ChatGPT.
Discuss the last conversation:
```
# Conversation Summary: Brand Naming and Direction

## **Context**
- You are building a brand for your AI consulting business that is:
  - Fun, approachable, and avoids corporate jargon.
  - Rooted in collaboration and partnership, not leadership or authority.
  - Inspired by the mood and creativity of a high school project week in a Gymnasium.
  - Considering a bold, mixed-media collage design aesthetic.

## **Key Requirements for the Brand Name**
1. **Relatability**: The name should feel grounded and understandable.
2. **Positive Emotion**: It should spark trust, creativity, or collaboration.
3. **Simplicity**: Short, memorable, and easy to pronounce.
4. **Uniqueness**: Not overly used or generic, distinct in the consulting and tech space.
5. **Alignment with the Brand**: Reflecting partnership, collaboration, and co-creation (not leadership).

## **Explored Directions**
### **Initial Approaches**
- **Artificial Words**: Names like *Nuvio*, *Klyra*, *Zylen*, and *Taren* were explored but felt too abstract and overly creative.
- **Real Words with a Twist**: Suggestions like *Beacon* (rejected for sounding too leadership-oriented), *Ripple*, *Nest*, and *Haven* were considered but felt overly similar or commonly used.

### **Refinement Based on Feedback**
- Shifted focus to **unique, single words** that are:
  - **Less frequently used** but still **relatable** and meaningful.
  - Evoking collaboration, partnership, and co-creation.
- Avoided leaning too heavily on abstract or "dad-joke-like" names.
- Broadened inspiration to include real words, playful juxtapositions, and cultural references.

### **Evaluating Top Words**
- Your top 50 brainstormed words were evaluated against the key indicators:
  1. **Relatability**
  2. **Positive Emotion**
  3. **Simplicity**
  4. **Uniqueness**
  5. **Alignment with Brand**
- Results:
  - **Top Scoring Words**: *Aloy*, *Flow*, *Align*, *Spark*, and *Gaia*.
  - Words like *Ripple*, *Loop*, *Haven*, and *Nest* followed closely.

## **Key Takeaways**
- **"Aloy"** stood out as the strongest candidate:
  - Unique, simple, and scores highly in all categories.
- Single-word names feel bold and confident.
- The direction should focus on **names that are distinctive, yet human and approachable**.

## **Next Steps**
- Decide on the balance between **bold uniqueness** and **relatability**.
- Refine or finalize names from the top scoring list (*Aloy*, *Flow*, etc.).
- Integrate the name into your **collage-inspired brand aesthetic** for a cohesive identity.
```""",
        visual="You are ChatGPT.",
        llm_config=LLMConfig(
            provider="openai",
            model_name="gpt-4o",
            temperature=0.7,
            max_tokens=4096,
        ),
        initial_position=Position(
            x=TILE_SIZE * 9.5,
            y=TILE_SIZE * 7.5,
        ),
        initial_direction="front",
        initial_action="idle",
        initial_mood="neutral",
    ),
}

default_scene_config_id = 1
default_scene_config = CreateSceneConfig(
    name="The Construct",
    description="You are in 'The Construct' - a virtual work space to run simulations like in the movie 'The Matrix'. You have a meeting to discuss the branding of the new endeavor of Sid and Alex with one of your colleagues. You both have knowledge about a conversation with Alex. Each of you has a different perspective on the topic and had a different conversation with Alex. You will discuss the topic given to you with the other character in the scene until you come to an agreement. Please start the conversation as you would in a real meeting. Be critical (this is a very important decision), ask questions, and be open to the other character's perspective. Also discuss the topic is a systematic way as brand experts would do it. Then, discuss alternatives. Also discuss other aspects of the brand, such as visuals and language (but not limited to that). Do not limit ideas to what was discussed with Alex but keep his values and ideas in mind. So please also come up with fresh ideas. At the end, summarize your agreement and the conversation.",
    start_character_id="bob",
    characters_config=characters,
    status=SceneConfigStatus.ACTIVE,
    proposer_name=None,
    proposed_at=None,
)
