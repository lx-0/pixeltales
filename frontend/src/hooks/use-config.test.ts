import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { apiClient } from '@/api/client';
import { makeQueryWrapper } from '@/test/query-wrapper';
import { getModelOptions, useConfig } from './use-config';

describe('useConfig', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('returns config payload on success', async () => {
    vi.spyOn(apiClient, 'GET').mockResolvedValueOnce({
      data: {
        llm_providers: [
          {
            id: 'openai',
            name: 'OpenAI',
            models: [
              { id: 'gpt-4o-mini', name: '4o mini', max_tokens: 4000, default_temperature: 0.7 },
            ],
          },
        ],
        colors: [{ id: 'blue', name: 'Blue', hex: '#0000ff', group: 'primary' }],
        sprites: [{ id: 'bob', name: 'Bob', path: '/x.png', has_idle_anim: true }],
        rooms: [{ id: 'room', name: 'Room', path: '/r.png' }],
      },
      error: undefined,
      response: new Response(),
      // biome-ignore lint/suspicious/noExplicitAny: openapi-fetch return type is unwieldy to mock; `any` is pragmatic in tests
    } as any);

    const { result } = renderHook(() => useConfig(), { wrapper: makeQueryWrapper() });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.colors[0].id).toBe('blue');
    expect(result.current.data?.sprites).toHaveLength(1);
  });

  test('throws on backend error', async () => {
    vi.spyOn(apiClient, 'GET').mockResolvedValueOnce({
      data: undefined,
      error: { detail: 'boom' },
      response: new Response('', { status: 500 }),
      // biome-ignore lint/suspicious/noExplicitAny: openapi-fetch return type is unwieldy to mock; `any` is pragmatic in tests
    } as any);

    const { result } = renderHook(() => useConfig(), { wrapper: makeQueryWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toMatch(/Failed to fetch config/);
  });
});

describe('getModelOptions', () => {
  test('flattens providers into select-friendly groups', () => {
    const groups = getModelOptions([
      {
        id: 'openai',
        name: 'OpenAI',
        models: [
          {
            id: 'gpt-4o',
            name: '4o',
            max_tokens: 4000,
            default_temperature: 0.7,
            description: 'big',
          },
          { id: 'gpt-4o-mini', name: '4o mini', max_tokens: 4000, default_temperature: 0.7 },
        ],
      },
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe('OpenAI');
    expect(groups[0].options.map((o) => o.value)).toEqual(['openai:gpt-4o', 'openai:gpt-4o-mini']);
    expect(groups[0].options[0].label_details).toBe('big');
  });
});
