import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { apiClient, type Schemas } from '@/api/client';
import type { SceneConfig } from '@/types/scene';
import { Logger } from '@/utils/logger';

const VOTED_PROPOSALS_KEY = 'pixeltales:voted_proposals';

function getVotedProposals(): Set<number> {
  try {
    const stored = localStorage.getItem(VOTED_PROPOSALS_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch (error) {
    Logger.error('use-scenes', 'Failed to get voted proposals from localStorage:', error);
    return new Set();
  }
}

function addVotedProposal(proposalId: number): void {
  try {
    const voted = getVotedProposals();
    voted.add(proposalId);
    localStorage.setItem(VOTED_PROPOSALS_KEY, JSON.stringify([...voted]));
  } catch (error) {
    Logger.error('use-scenes', 'Failed to save voted proposal to localStorage:', error);
  }
}

export function useVotedProposals(): [Set<number>, (proposalId: number) => void] {
  const [votedProposals, setVotedProposals] = useState<Set<number>>(() => getVotedProposals());

  useEffect(() => {
    const handleStorageChange = () => setVotedProposals(getVotedProposals());
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const addVote = useCallback((proposalId: number) => {
    addVotedProposal(proposalId);
    setVotedProposals((prev) => {
      const next = new Set(prev);
      next.add(proposalId);
      return next;
    });
  }, []);

  return [votedProposals, addVote];
}

export function useProposedScenes() {
  return useQuery({
    queryKey: ['scenes', 'proposed'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/scenes/proposed');
      if (error) throw new Error('Failed to fetch proposed scenes');
      return data;
    },
  });
}

export function useSceneProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sceneConfig: Schemas['CreateSceneConfig']) => {
      const { data, error } = await apiClient.POST('/api/v1/scenes/propose', { body: sceneConfig });
      if (error) throw new Error('Failed to propose scene');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenes', 'proposed'] });
    },
  });
}

export function useSceneVote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sceneConfigId, vote }: { sceneConfigId: number; vote: number }) => {
      if (getVotedProposals().has(sceneConfigId)) {
        Logger.warn('use-scenes', 'You have already voted on this proposal');
        throw new Error('You have already voted on this proposal');
      }

      Logger.info('use-scenes', `Voting on scene config ${sceneConfigId} with vote ${vote}`);
      const { data, error } = await apiClient.POST('/api/v1/scenes/{scene_config_id}/vote', {
        params: { path: { scene_config_id: String(sceneConfigId) } },
        body: { vote },
      });
      if (error) throw new Error('Failed to vote on scene');
      return data;
    },
    onMutate: async ({ sceneConfigId, vote }) => {
      await queryClient.cancelQueries({ queryKey: ['scenes', 'proposed'] });
      const previousProposals = queryClient.getQueryData<SceneConfig[]>(['scenes', 'proposed']);

      if (previousProposals) {
        queryClient.setQueryData<SceneConfig[]>(['scenes', 'proposed'], (old) => {
          if (!old) return [];
          return old.map((proposal) =>
            proposal.id === sceneConfigId
              ? { ...proposal, votes: (proposal.votes || 0) + vote }
              : proposal
          );
        });
      }

      return { previousProposals };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousProposals) {
        queryClient.setQueryData(['scenes', 'proposed'], context.previousProposals);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['scenes', 'proposed'] });
    },
  });
}

export function useHasVoted(proposalId: number): boolean {
  return getVotedProposals().has(proposalId);
}

export function useSceneComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sceneConfigId,
      user,
      comment,
    }: {
      sceneConfigId: number;
      user: string;
      comment: string;
    }) => {
      const { data, error } = await apiClient.POST('/api/v1/scenes/{scene_config_id}/comment', {
        params: {
          path: { scene_config_id: String(sceneConfigId) },
          query: { user, comment },
        },
      });
      if (error) throw new Error('Failed to comment on scene');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenes', 'proposed'] });
    },
  });
}
