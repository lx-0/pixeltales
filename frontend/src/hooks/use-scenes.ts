import { SceneConfig } from '@/types/scene';
import { Logger } from '@/utils/logger';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';

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
  const [votedProposals, setVotedProposals] = React.useState<Set<number>>(() =>
    getVotedProposals(),
  );

  // Update voted proposals when localStorage changes
  React.useEffect(() => {
    const handleStorageChange = () => {
      setVotedProposals(getVotedProposals());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const addVote = React.useCallback((proposalId: number) => {
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
      scene: Omit<SceneConfig, 'id' | 'status' | 'system_prompt'>,
    ) => {
      const response = await fetch('/api/v1/scenes/propose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scene),
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
      sceneId,
      vote,
    }: {
      sceneId: number;
      vote: number;
    }) => {
      // Check if already voted
      const votedProposals = getVotedProposals();
      if (votedProposals.has(sceneId)) {
        throw new Error('You have already voted on this proposal');
      }

      Logger.info(`use-scenes`, `Voting on scene ${sceneId} with vote ${vote}`);
      const response = await fetch(`/api/v1/scenes/${sceneId}/vote`, {
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
    onSuccess: (_, { sceneId }) => {
      // Save voted proposal to localStorage
      addVotedProposal(sceneId);
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
      sceneId,
      user,
      comment,
    }: {
      sceneId: number;
      user: string;
      comment: string;
    }) => {
      const response = await fetch(`/api/v1/scenes/${sceneId}/comment`, {
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
