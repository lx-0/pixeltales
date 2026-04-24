import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { apiClient } from '@/api/client';
import { makeQueryWrapper } from '@/test/query-wrapper';
import { type CharacterIdentity, useCharacters, useCreateCharacter } from './use-characters';

const sampleIdentity: CharacterIdentity = {
  id: 'bob',
  name: 'Bob',
  color: '#4A90E2',
  role: 'A test character',
  visual: 'A test visual',
  sprite_id: 'bob',
  llm_config: {
    provider: 'openai',
    model_name: 'gpt-4o-mini',
    temperature: 0.7,
    max_tokens: 4096,
  },
};

describe('useCharacters', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('returns the library list on success', async () => {
    vi.spyOn(apiClient, 'GET').mockResolvedValueOnce({
      data: [sampleIdentity],
      error: undefined,
      response: new Response(),
      // biome-ignore lint/suspicious/noExplicitAny: openapi-fetch return type is unwieldy to mock; `any` is pragmatic in tests
    } as any);

    const { result } = renderHook(() => useCharacters(), { wrapper: makeQueryWrapper() });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].id).toBe('bob');
  });

  test('throws on fetch failure', async () => {
    vi.spyOn(apiClient, 'GET').mockResolvedValueOnce({
      data: undefined,
      error: { detail: 'down' },
      response: new Response('', { status: 500 }),
      // biome-ignore lint/suspicious/noExplicitAny: openapi-fetch return type is unwieldy to mock; `any` is pragmatic in tests
    } as any);

    const { result } = renderHook(() => useCharacters(), { wrapper: makeQueryWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toMatch(/Failed to fetch character library/);
  });
});

describe('useCreateCharacter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('POSTs the identity payload', async () => {
    const post = vi.spyOn(apiClient, 'POST').mockResolvedValueOnce({
      data: sampleIdentity,
      error: undefined,
      response: new Response('', { status: 201 }),
      // biome-ignore lint/suspicious/noExplicitAny: openapi-fetch return type is unwieldy to mock; `any` is pragmatic in tests
    } as any);

    const { result } = renderHook(() => useCreateCharacter(), { wrapper: makeQueryWrapper() });

    await result.current.mutateAsync(sampleIdentity);
    expect(post).toHaveBeenCalledWith('/api/v1/characters', { body: sampleIdentity });
  });

  test('surfaces 409 detail in the thrown error', async () => {
    vi.spyOn(apiClient, 'POST').mockResolvedValueOnce({
      data: undefined,
      error: { detail: "character id 'bob' already exists in library" },
      response: new Response('', { status: 409 }),
      // biome-ignore lint/suspicious/noExplicitAny: openapi-fetch return type is unwieldy to mock; `any` is pragmatic in tests
    } as any);

    const { result } = renderHook(() => useCreateCharacter(), { wrapper: makeQueryWrapper() });

    await expect(result.current.mutateAsync(sampleIdentity)).rejects.toThrow(/already exists/);
  });

  test('throws with HTTP status when no detail is provided', async () => {
    vi.spyOn(apiClient, 'POST').mockResolvedValueOnce({
      data: undefined,
      error: {},
      response: new Response('', { status: 422 }),
      // biome-ignore lint/suspicious/noExplicitAny: openapi-fetch return type is unwieldy to mock; `any` is pragmatic in tests
    } as any);

    const { result } = renderHook(() => useCreateCharacter(), { wrapper: makeQueryWrapper() });

    await expect(result.current.mutateAsync(sampleIdentity)).rejects.toThrow(/HTTP 422/);
  });
});
