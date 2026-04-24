import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { apiClient } from '@/api/client';
import { makeQueryWrapper } from '@/test/query-wrapper';
import { useScene } from './use-scenes';

describe('useScene', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('does not fire when sceneConfigId is null', () => {
    const get = vi.spyOn(apiClient, 'GET');
    const { result } = renderHook(() => useScene(null), { wrapper: makeQueryWrapper() });
    expect(get).not.toHaveBeenCalled();
    expect(result.current.fetchStatus).toBe('idle');
  });

  test('fetches the scene by id and surfaces it', async () => {
    const get = vi.spyOn(apiClient, 'GET').mockResolvedValueOnce({
      data: { id: 1, name: 'Test Scene', characters_config: {}, room_id: 'room' },
      error: undefined,
      response: new Response(),
      // biome-ignore lint/suspicious/noExplicitAny: openapi-fetch return type is unwieldy to mock; `any` is pragmatic in tests
    } as any);

    const { result } = renderHook(() => useScene(1), { wrapper: makeQueryWrapper() });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(get).toHaveBeenCalledWith('/api/v1/scenes/{scene_config_id}', {
      params: { path: { scene_config_id: '1' } },
    });
    expect(result.current.data?.name).toBe('Test Scene');
  });

  test('throws on backend failure', async () => {
    vi.spyOn(apiClient, 'GET').mockResolvedValueOnce({
      data: undefined,
      error: { detail: 'not found' },
      response: new Response('', { status: 404 }),
      // biome-ignore lint/suspicious/noExplicitAny: openapi-fetch return type is unwieldy to mock; `any` is pragmatic in tests
    } as any);

    const { result } = renderHook(() => useScene(99), { wrapper: makeQueryWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toMatch(/Failed to fetch scene 99/);
  });
});
