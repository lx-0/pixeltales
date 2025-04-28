import { Label } from '@yesterday-ai/shadcn-ui';
import { Loader2 } from 'lucide-react';

interface GeneratingStepProps {
  stepNumber: number;
  stepTitle: string;
  baseSpriteUrl?: string | null; // Optional base sprite to show during generation
}

export function GeneratingStep({ stepNumber, stepTitle, baseSpriteUrl }: GeneratingStepProps) {
  return (
    <div className="space-y-2 text-center">
      <Label className="text-gray-200">{`${stepNumber}. ${stepTitle}`}</Label>
      <div className="flex justify-center items-center p-4 border border-gray-700 rounded bg-gray-800/50 min-h-[150px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
      {baseSpriteUrl && (
        <div className="text-xs text-gray-400 pt-2">
          Using this base sprite:
          <img
            src={baseSpriteUrl}
            alt="Base Sprite"
            className="mx-auto mt-1 w-12 h-24 image-rendering-pixelated border border-gray-600"
          />
        </div>
      )}
    </div>
  );
}
