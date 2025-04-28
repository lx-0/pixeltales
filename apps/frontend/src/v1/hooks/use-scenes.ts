import { ScenesApiService } from '@/v1/lib/api';
import { NewSceneConfig, SceneConfig } from '@pixeltales/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Logger } from '@yesterday-ai/logger-frontend';
import { useCallback, useEffect, useState } from 'react';

const VOTED_PROPOSALS_KEY = 'pixeltales:voted_proposals';

const scenesApi = new ScenesApiService({
  baseURL: import.meta.env.VITE_BACKEND_URL,
});

// Helper functions for vote persistence
function getVotedProposals(): Set<SceneConfig['id']> {
  try {
    const stored = localStorage.getItem(VOTED_PROPOSALS_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch (error) {
    Logger.error('use-scenes', 'Failed to get voted proposals from localStorage:', error);
    return new Set();
  }
}

function addVotedProposal(proposalId: SceneConfig['id']): void {
  try {
    const voted = getVotedProposals();
    voted.add(proposalId);
    localStorage.setItem(VOTED_PROPOSALS_KEY, JSON.stringify([...voted]));
  } catch (error) {
    Logger.error('use-scenes', 'Failed to save voted proposal to localStorage:', error);
  }
}

// Hook to get all voted proposals
export function useVotedProposals(): [
  Set<SceneConfig['id']>,
  (proposalId: SceneConfig['id']) => void,
] {
  const [votedProposals, setVotedProposals] = useState<Set<SceneConfig['id']>>(() =>
    getVotedProposals(),
  );

  // Update voted proposals when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setVotedProposals(getVotedProposals());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const addVote = useCallback((proposalId: SceneConfig['id']) => {
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
  return useQuery<SceneConfig[]>({
    queryKey: ['scenes', 'proposed'],
    queryFn: async () => {
      return scenesApi.getProposedScenes();
    },
  });
}

export function useSceneProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sceneConfig: NewSceneConfig) => {
      return scenesApi.proposeScene(sceneConfig);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenes', 'proposed'] });
    },
  });
}

export function useSceneVote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sceneConfigId,
      vote,
    }: {
      sceneConfigId: SceneConfig['id'];
      vote: number;
    }) => {
      // Check if already voted
      const votedProposals = getVotedProposals();
      if (votedProposals.has(sceneConfigId)) {
        Logger.warn(`use-scenes`, `You have already voted on this proposal`);
        throw new Error('You have already voted on this proposal');
      }

      // Only allow valid vote values
      if (vote !== 1 && vote !== -1) {
        throw new Error('Vote value must be 1 or -1');
      }

      return scenesApi.voteOnScene(sceneConfigId, vote as 1 | -1);
    },
    onMutate: async ({ sceneConfigId, vote }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['scenes', 'proposed'] });

      // Snapshot the previous value
      const previousProposals = queryClient.getQueryData<SceneConfig[]>(['scenes', 'proposed']);

      // Optimistically update the proposals
      if (previousProposals) {
        queryClient.setQueryData<SceneConfig[]>(['scenes', 'proposed'], (old) => {
          if (!old) return [];
          return old.map((proposal) =>
            proposal.id === sceneConfigId
              ? { ...proposal, votes: (proposal.votes || 0) + vote }
              : proposal,
          );
        });
      }

      // Return context with the snapshotted value
      return { previousProposals };
    },
    onError: (_err, _variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousProposals) {
        queryClient.setQueryData(['scenes', 'proposed'], context.previousProposals);
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure data is in sync with server
      queryClient.invalidateQueries({ queryKey: ['scenes', 'proposed'] });
    },
  });
}

// Hook to check if user has voted on a proposal
export function useHasVoted(proposalId: SceneConfig['id']): boolean {
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
      sceneConfigId: SceneConfig['id'];
      user: string;
      comment: string;
    }) => {
      return scenesApi.commentOnScene(sceneConfigId, user, comment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenes', 'proposed'] });
    },
  });
}
