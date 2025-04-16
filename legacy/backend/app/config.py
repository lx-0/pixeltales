from typing import List

from app.models.config import ColorOption, LLMModel, LLMProvider

# System prompt
SYSTEM_PROMPT = """You are {character_name}.
{character_visual}

Your character role is described as follows:
```role
{character_role}
```

Scene description:
```scene
{scene_description}
```

Current conversation duration: {conversation_length} messages.
Time: {current_time}

IMPORTANT RULES:
1. Keep responses natural, 1-2 sentences
2. Choose a mood that matches your personality
3. Select an appropriate emoji for the mood
4. Stay in character at all times
5. Respond to the context of the conversation and your current situation"""

# Tile size
TILE_SIZE = 48

LLM_PROVIDERS: List[LLMProvider] = [
    LLMProvider(
        id="openai",
        name="OpenAI",
        models=[
            LLMModel(
                id="gpt-4o-2024-11-20",  # max context window/output tokens: 128K / 16,384
                name="4o",
                description="Multimodal model with 128K context window for text, images, and audio.",
                max_tokens=4000,
                default_temperature=0.7,
            ),
            LLMModel(
                id="gpt-4o-mini-2024-07-18",  # max context window/output tokens: 128K / 16,384
                name="4o mini",
                description="Smaller, cost-effective version of GPT-4o with similar capabilities.",
                max_tokens=4000,
                default_temperature=0.7,
            ),
            LLMModel(
                id="o1-2024-12-17",  # max context window/output tokens: 200K / 100,000
                name="o1",
                description="Advanced reasoning model for complex problem-solving and coding.",
                max_tokens=4000,
                default_temperature=0.7,
            ),
            LLMModel(
                id="o1-mini-2024-09-12",  # max context window/output tokens: 128K / 65,536
                name="o1 mini",
                description="Streamlined version of o1 for faster, simpler tasks.",
                max_tokens=4000,
                default_temperature=0.7,
            ),
        ],
    ),
    LLMProvider(
        id="anthropic",
        name="Anthropic",
        models=[
            LLMModel(
                id="claude-3-5-sonnet-20241022",  # max context window/output tokens: 200K / 8,192
                name="Claude 3.5 Sonnet",
                description="High-context model excelling in reasoning and coding.",
                max_tokens=4000,
                default_temperature=0.7,
            ),
            LLMModel(
                id="claude-3-5-haiku-20241022",  # max context window/output tokens: 200K / 8,192
                name="Claude 3.5 Haiku",
                description="Fast, efficient model optimized for concise tasks.",
                max_tokens=4000,
                default_temperature=0.7,
            ),
            LLMModel(
                id="claude-3-opus-20240229",  # max context window/output tokens: 200K / 4,096
                name="Claude 3 Opus",
                description="Balanced model for deep analysis and complex tasks.",
                max_tokens=4000,
                default_temperature=0.7,
            ),
        ],
    ),
]

CHARACTER_COLORS: List[ColorOption] = [
    # Gray scale
    ColorOption(id="slate", name="Slate", hex="#64748b", group="gray"),
    ColorOption(id="gray", name="Gray", hex="#6b7280", group="gray"),
    ColorOption(id="zinc", name="Zinc", hex="#71717a", group="gray"),
    ColorOption(id="neutral", name="Neutral", hex="#737373", group="gray"),
    ColorOption(id="stone", name="Stone", hex="#78716c", group="gray"),
    # Primary colors
    ColorOption(id="red", name="Red", hex="#ef4444", group="primary"),
    ColorOption(id="orange", name="Orange", hex="#f97316", group="primary"),
    ColorOption(id="yellow", name="Yellow", hex="#eab308", group="primary"),
    ColorOption(id="green", name="Green", hex="#22c55e", group="primary"),
    ColorOption(id="blue", name="Blue", hex="#3b82f6", group="primary"),
    ColorOption(id="purple", name="Purple", hex="#a855f7", group="primary"),
    # Brand colors
    ColorOption(id="indigo", name="Indigo", hex="#6366f1", group="brand"),
    ColorOption(id="violet", name="Violet", hex="#8b5cf6", group="brand"),
    ColorOption(id="fuchsia", name="Fuchsia", hex="#d946ef", group="brand"),
    ColorOption(id="pink", name="Pink", hex="#ec4899", group="brand"),
    ColorOption(id="rose", name="Rose", hex="#f43f5e", group="brand"),
    # Nature colors
    ColorOption(id="amber", name="Amber", hex="#f59e0b", group="nature"),
    ColorOption(id="lime", name="Lime", hex="#84cc16", group="nature"),
    ColorOption(id="emerald", name="Emerald", hex="#10b981", group="nature"),
    ColorOption(id="teal", name="Teal", hex="#14b8a6", group="nature"),
    ColorOption(id="cyan", name="Cyan", hex="#06b6d4", group="nature"),
    ColorOption(id="sky", name="Sky", hex="#0ea5e9", group="nature"),
]
