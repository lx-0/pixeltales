import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { makeQueryWrapper } from '@/test/query-wrapper';
import type { CharacterConfig, SceneConfig, SceneState } from '@/types/scene';
import ConversationHistory from './ConversationHistory';

function makeChar(id: string, name: string, color: string): CharacterConfig {
  return {
    id,
    name,
    color,
    role: 'role',
    visual: 'visual',
    sprite_id: 'bob',
    llm_config: {
      provider: 'openai',
      model_name: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 4000,
    },
    initial_position: { x: 0, y: 0 },
    initial_direction: 'right',
    initial_action: 'idle',
    initial_mood: 'neutral',
  };
}

function makeScene(): { state: SceneState; config: SceneConfig } {
  const state: SceneState = {
    scene_id: 1,
    scene_config_id: 1,
    characters: {
      bob: {
        id: 'bob',
        position: { x: 0, y: 0 },
        direction: 'right',
        current_mood: 'neutral',
        action: 'speaking',
        action_started_at: 0,
        action_estimated_duration: null,
        end_conversation_requested: false,
        end_conversation_requested_at: null,
        end_conversation_requested_validity_duration: null,
      },
      alice: {
        id: 'alice',
        position: { x: 0, y: 0 },
        direction: 'left',
        current_mood: 'neutral',
        action: 'thinking',
        action_started_at: 0,
        action_estimated_duration: null,
        end_conversation_requested: false,
        end_conversation_requested_at: null,
        end_conversation_requested_validity_duration: null,
      },
    },
    messages: [
      {
        character: 'bob',
        content: 'Hi Alice',
        recipient: 'alice',
        thoughts: 'just saying hi',
        mood: 'curious',
        mood_emoji: '🙂',
        reaction_on_previous_message: null,
        timestamp: '2026-04-24T10:00:00',
        unix_timestamp: 1745486400,
        calculated_speaking_time: 5,
        conversation_rating: null,
        end_conversation: false,
      },
    ],
    started_at: 1745486400,
    conversation_active: true,
    conversation_ended: false,
    ended_at: null,
    visitor_count: 1,
  };

  const config: SceneConfig = {
    id: 1,
    name: 'Test',
    description: 'a test scene',
    start_character_id: 'bob',
    room_id: 'room',
    system_prompt: 'sys',
    status: 'active',
    votes: 0,
    characters_config: {
      bob: makeChar('bob', 'Bob', '#0000ff'),
      alice: makeChar('alice', 'Alice', '#ff00ff'),
    },
  };

  return { state, config };
}

describe('ConversationHistory', () => {
  test('renders a message with speaker name + content from sceneConfig', () => {
    const { state, config } = makeScene();
    render(
      <ConversationHistory
        scene={state}
        sceneConfig={config}
        isSideView={true}
        setIsModalOpen={() => {}}
        onToggleViewMode={() => {}}
      />,
      { wrapper: makeQueryWrapper() }
    );

    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Hi Alice')).toBeInTheDocument();
  });

  test('shows the "is thinking" placeholder for thinking characters', () => {
    const { state, config } = makeScene();
    render(
      <ConversationHistory
        scene={state}
        sceneConfig={config}
        isSideView={true}
        setIsModalOpen={() => {}}
        onToggleViewMode={() => {}}
      />,
      { wrapper: makeQueryWrapper() }
    );

    expect(screen.getByText('is thinking...')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  test('view-mode toggle button calls onToggleViewMode', async () => {
    const onToggle = vi.fn();
    const { state, config } = makeScene();
    render(
      <ConversationHistory
        scene={state}
        sceneConfig={config}
        isSideView={false}
        setIsModalOpen={() => {}}
        onToggleViewMode={onToggle}
      />,
      { wrapper: makeQueryWrapper() }
    );

    const button = screen.getByRole('button', { name: /show beside game canvas/i });
    await userEvent.click(button);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  test('collapse chevron toggles expansion', async () => {
    const { state, config } = makeScene();
    render(
      <ConversationHistory
        scene={state}
        sceneConfig={config}
        isSideView={true}
        setIsModalOpen={() => {}}
        onToggleViewMode={() => {}}
      />,
      { wrapper: makeQueryWrapper() }
    );

    const collapseBtn = screen.getByRole('button', { name: /Collapse Conversation History/i });
    expect(screen.getByText('Hi Alice')).toBeInTheDocument();
    await userEvent.click(collapseBtn);
    expect(screen.queryByText('Hi Alice')).not.toBeInTheDocument();
  });
});
