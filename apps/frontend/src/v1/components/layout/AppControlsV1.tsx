import { Button } from '@yesterday-ai/shadcn-ui';
import { SceneProposalForm } from '../SceneProposalForm';

interface AppControlsV1Props {
  setIsModalOpen: (isOpen: boolean) => void;
}

export function AppControlsV1({ setIsModalOpen }: AppControlsV1Props) {
  return (
    <>
      {/* Scene Proposal Button */}
      <SceneProposalForm
        trigger={
          <Button
            className="text-white bg-gray-700 hover:bg-gray-600 w-full sm:w-auto"
            variant="secondary"
            size="sm"
          >
            Propose Next Scene
          </Button>
        }
        setIsModalOpen={setIsModalOpen}
      />
    </>
  );
}
