export interface Position {
  x: number;
  y: number;
}

export type Direction = 'front' | 'right' | 'left' | 'back';

export interface Message {
  character: string;
  content: string | null;
  recipient: string;
  thoughts: string;
  mood: string; // Free-form mood description
  mood_emoji: string; // Matching emoji for the mood
  reaction_on_previous_message: string | null; // Reaction on the previous message (single emoji)
  timestamp: string; // ISO 8601
  unix_timestamp: number; // Unix timestamp (Epoch time)
  calculated_speaking_time: number; // seconds
  conversation_rating: number | null; // 0-10
  end_conversation: boolean;
}

export interface LLMConfig {
  provider: 'openai' | 'anthropic';
  model_name: string;
  temperature: number;
  max_tokens: number;
}

export type CharacterAction =
  | 'thinking'
  | 'thinking:love'
  | 'thinking:anger'
  | 'thinking:sadness'
  | 'thinking:surprise'
  | 'thinking:fear'
  | 'speaking'
  | 'idle';

interface CharacterBase {
  // Base
  id: string;
  name: string;
  color: string; // hex color code
  role: string;
  visual: string;
  llm_config: LLMConfig;
}

export interface CharacterState extends CharacterBase {
  position: Position;
  direction: Direction;
  current_mood: string; // Free-form mood description
  action: CharacterAction;
  action_started_at: number; // Unix timestamp (Epoch time)
  action_estimated_duration: number | null; // seconds
  end_conversation_requested: boolean;
  end_conversation_requested_at: number | null; // Unix timestamp (Epoch time)
  end_conversation_requested_validity_duration: number | null; // seconds
}

export interface SceneState {
  scene_id: number;
  scene_config_id: number;
  characters: Record<string, CharacterState>;
  messages: Array<Message>;
  started_at: number; // Unix timestamp (Epoch time)
  conversation_active: boolean;
  conversation_ended: boolean;
  ended_at: number | null; // Unix timestamp (Epoch time)
  visitor_count: number; // number of current visitors in the scene
}

export interface CharacterConfig extends CharacterBase {
  initial_position?: Position;
  initial_direction?: Direction;
  initial_action?: CharacterAction;
  initial_mood?: string;
}

export interface SceneConfig {
  id: number;
  name: string;
  description: string;
  start_character_id: string;
  characters_config: Record<string, CharacterConfig>;
  system_prompt: string;
  status: 'proposed' | 'active' | 'rejected';

  // Proposal-specific fields
  proposer_name?: string;
  proposed_at?: number; // Unix timestamp (Epoch time)
  votes?: number;
  comments?: Array<{
    user: string;
    comment: string;
    timestamp: number; // Unix timestamp (Epoch time)
  }>;
}
