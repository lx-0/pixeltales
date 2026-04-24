import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, type Schemas } from '@/api/client';

export type CharacterIdentity = Schemas['CharacterIdentity'];

export function useCharacters() {
  return useQuery({
    queryKey: ['characters'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/characters');
      if (error) throw new Error('Failed to fetch character library');
      return data;
    },
    staleTime: 1000 * 60, // characters change rarely
  });
}

export function useCreateCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (identity: CharacterIdentity) => {
      const { data, error, response } = await apiClient.POST('/api/v1/characters', {
        body: identity,
      });
      if (error) {
        // Surface backend's 409 / 422 / 400 detail to the caller verbatim.
        const detail =
          (typeof error === 'object' && error !== null && 'detail' in error
            ? (error as { detail: unknown }).detail
            : undefined) ?? `HTTP ${response.status}`;
        throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
    },
  });
}
