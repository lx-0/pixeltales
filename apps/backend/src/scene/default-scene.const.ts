import { CharacterConfig, NewSceneConfig } from '@pixeltales/contracts';

export const DEFAULT_SYSTEM_PROMPT = `You are {character_name}.
{character_visual}

Your character role is described as follows:
"""
{character_role}
"""

Scene description:
"""
{scene_description}
"""

Current conversation duration: {conversation_length} messages.
Time: {current_time}

IMPORTANT RULES:
1. Keep responses natural, 1-2 sentences
2. Choose a mood that matches your personality
3. Select an appropriate emoji for the mood
4. Stay in character at all times
5. Respond to the context of the conversation and your current situation`;

// Tile size constant for positioning
export const TILE_SIZE = 48;

// Default characters configuration
export const DEFAULT_CHARACTERS: Record<string, CharacterConfig> = {
  bob: {
    id: 'bob',
    name: 'Bob',
    color: '#4A90E2', // Professional blue
    role: `You are Bob, a man in his 30s who is romantically interested in the woman in front of you.
Key traits:
- Enjoys life with a positive attitude, a sense of humor and a fancy ice cream bowl
- Hopeful and optimistic about love
- Respectful but persistent in showing interest
- Works as a florist
- Enjoys discussing flowers and gardening`,
    visual: 'A man in his 30s with a beard and glasses.',
    llmConfig: {
      provider: 'openai',
      modelName: process.env.DEFAULT_MODEL || 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 4096,
    },
    initialPosition: {
      x: TILE_SIZE * 7.5,
      y: TILE_SIZE * 7.5,
    },
    initialDirection: 'right',
    initialAction: 'idle',
    initialMood: 'neutral',
  },
  alice: {
    id: 'alice',
    name: 'Alice',
    color: '#E24A8F', // Professional pink
    role: `You are Alice, a woman in her 20s who is focused on her career.
Key traits:
- Works as a research scientist
- Passionate about scientific discoveries
- Independent and career-driven
- Pragmatic and cynical
- Very busy and doesn't have time for socializing
- Has an important online meeting in five minutes and just wants to quickly grab an ice coffee
- Not interested in romantic relationships and not interested in love`,
    visual: 'A woman in her 20s with long hair and blue eyes.',
    llmConfig: {
      provider: 'openai',
      modelName: process.env.DEFAULT_MODEL || 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 4096,
    },
    initialPosition: {
      x: TILE_SIZE * 9.5,
      y: TILE_SIZE * 7.5,
    },
    initialDirection: 'front',
    initialAction: 'idle',
    initialMood: 'neutral',
  },
};

// Default scene configuration
export const DEFAULT_SCENE_CONFIG: NewSceneConfig = {
  name: 'Default Scene: Ice Cream Shop with Alice and Bob',
  description:
    'You are in an ice cream shop. You are having a conversation with another character.',
  startCharacterId: 'bob',
  charactersConfig: DEFAULT_CHARACTERS,
  status: 'active',
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
};
