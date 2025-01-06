import { useToast } from '@/hooks/use-toast';
import { SceneConfig } from '@/types/scene';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
  useProposedScenes,
  useSceneVote,
  useVotedProposals,
} from '../hooks/use-scenes';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

interface SceneProposalListProps {
  trigger?: React.ReactNode;
  setIsModalOpen: (isOpen: boolean) => void;
}

export function SceneProposalList({
  trigger,
  setIsModalOpen,
}: SceneProposalListProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: proposals, isLoading, error } = useProposedScenes();
  const voteMutation = useSceneVote();
  const { toast } = useToast();
  const [votedProposals, addVote] = useVotedProposals();

  const handleVote = async (proposalId: SceneConfig['id'], vote: number) => {
    try {
      await voteMutation.mutateAsync({ sceneConfigId: proposalId, vote });
      addVote(proposalId);
      toast({
        title: 'Vote submitted',
        description: 'Your vote has been recorded.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to submit vote',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    setIsModalOpen(isOpen);
  }, [isOpen, setIsModalOpen]);

  if (error) {
    return <div>Error loading proposals</div>;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">View Proposals</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] lg:max-w-screen-lg bg-gray-900">
        <DialogHeader>
          <DialogTitle>Scene Proposals</DialogTitle>
          <DialogDescription>
            Vote on proposed scenes for the next conversation.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              Loading proposals...
            </div>
          ) : !proposals?.length ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              No proposals yet
            </div>
          ) : (
            <div className="space-y-4">
              {proposals.map((proposal) => {
                const hasVoted = votedProposals.has(proposal.id);
                const isVoting =
                  voteMutation.isPending &&
                  voteMutation.variables?.sceneConfigId === proposal.id;

                return (
                  <div
                    key={proposal.id}
                    className="p-4 bg-gray-800 rounded-lg border border-gray-700"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {proposal.name}
                        </h3>
                        <p className="text-sm text-gray-400">
                          Proposed by {proposal.proposer_name} on{' '}
                          {new Date(proposal.proposed_at!).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleVote(proposal.id, 1)}
                          disabled={hasVoted || isVoting}
                          className={`${
                            hasVoted || isVoting
                              ? 'text-gray-500 hover:text-gray-500 cursor-not-allowed opacity-50'
                              : 'text-green-500 hover:text-green-400'
                          }`}
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium min-w-[2ch] text-center">
                          {proposal.votes || 0}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleVote(proposal.id, -1)}
                          disabled={hasVoted || isVoting}
                          className={`${
                            hasVoted || isVoting
                              ? 'text-gray-500 hover:text-gray-500 cursor-not-allowed opacity-50'
                              : 'text-red-500 hover:text-red-400'
                          }`}
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <p className="mt-2 text-sm text-gray-300">
                      {proposal.description}
                    </p>

                    <Separator className="my-4" />

                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(proposal.characters_config).map(
                        ([id, char]) => (
                          <div
                            key={id}
                            className="p-3 bg-gray-700 rounded border-2"
                            style={{ borderColor: char.color }}
                          >
                            <h4
                              className="font-semibold"
                              style={{ color: char.color }}
                            >
                              {char.name}
                            </h4>
                            <p className="text-sm text-gray-300 mt-1">
                              {char.visual}
                            </p>
                            <p className="text-xs text-gray-400 mt-1 italic">
                              {char.role.split('\n')[0]}
                            </p>
                          </div>
                        ),
                      )}
                    </div>

                    {proposal.comments?.length ? (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Comments</h4>
                        <div className="space-y-2">
                          {proposal.comments.map((comment, i) => (
                            <div
                              key={i}
                              className="text-sm bg-gray-700 rounded p-2"
                            >
                              <p className="text-gray-300">{comment.comment}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {comment.user} -{' '}
                                {new Date(comment.timestamp).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
