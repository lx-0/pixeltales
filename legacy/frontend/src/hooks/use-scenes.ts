import { SceneConfig } from '@/types/scene';
import { Logger } from '@/utils/logger';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

const VOTED_PROPOSALS_KEY = 'pixeltales:voted_proposals';

// Helper functions for vote persistence
function getVotedProposals(): Set<number> {
  try {
    const stored = localStorage.getItem(VOTED_PROPOSALS_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch (error) {
    Logger.error(
      'use-scenes',
      'Failed to get voted proposals from localStorage:',
      error,
    );
    return new Set();
  }
}

function addVotedProposal(proposalId: number): void {
  try {
    const voted = getVotedProposals();
    voted.add(proposalId);
    localStorage.setItem(VOTED_PROPOSALS_KEY, JSON.stringify([...voted]));
  } catch (error) {
    Logger.error(
      'use-scenes',
      'Failed to save voted proposal to localStorage:',
      error,
    );
  }
}

// Hook to get all voted proposals
export function useVotedProposals(): [
  Set<number>,
  (proposalId: number) => void,
] {
  const [votedProposals, setVotedProposals] = useState<Set<number>>(() =>
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
  return useQuery<SceneConfig[]>({
    queryKey: ['scenes', 'proposed'],
    queryFn: async () => {
      const response = await fetch('/api/v1/scenes/proposed');
      if (!response.ok) {
        throw new Error('Failed to fetch proposed scenes');
      }
      return response.json();
    },
  });
}

export function useSceneProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      sceneConfig: Omit<SceneConfig, 'id' | 'status' | 'system_prompt'>,
    ) => {
      const response = await fetch('/api/v1/scenes/propose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sceneConfig),
      });
      if (!response.ok) {
        throw new Error('Failed to propose scene');
      }
      return response.json();
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
      sceneConfigId: number;
      vote: number;
    }) => {
      // Check if already voted
      const votedProposals = getVotedProposals();
      if (votedProposals.has(sceneConfigId)) {
        Logger.warn(`use-scenes`, `You have already voted on this proposal`);
        throw new Error('You have already voted on this proposal');
      }

      Logger.info(
        `use-scenes`,
        `Voting on scene config ${sceneConfigId} with vote ${vote}`,
      );
      const response = await fetch(`/api/v1/scenes/${sceneConfigId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vote }),
      });
      if (!response.ok) {
        throw new Error('Failed to vote on scene');
      }
      return response.json();
    },
    onMutate: async ({ sceneConfigId, vote }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['scenes', 'proposed'] });

      // Snapshot the previous value
      const previousProposals = queryClient.getQueryData<SceneConfig[]>([
        'scenes',
        'proposed',
      ]);

      // Optimistically update the proposals
      if (previousProposals) {
        queryClient.setQueryData<SceneConfig[]>(
          ['scenes', 'proposed'],
          (old) => {
            if (!old) return [];
            return old.map((proposal) =>
              proposal.id === sceneConfigId
                ? { ...proposal, votes: (proposal.votes || 0) + vote }
                : proposal,
            );
          },
        );
      }

      // Return context with the snapshotted value
      return { previousProposals };
    },
    onError: (_err, _variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousProposals) {
        queryClient.setQueryData(
          ['scenes', 'proposed'],
          context.previousProposals,
        );
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure data is in sync with server
      queryClient.invalidateQueries({ queryKey: ['scenes', 'proposed'] });
    },
  });
}

// Hook to check if user has voted on a proposal
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
      const response = await fetch(`/api/v1/scenes/${sceneConfigId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user, comment }),
      });
      if (!response.ok) {
        throw new Error('Failed to comment on scene');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenes', 'proposed'] });
    },
  });
}
