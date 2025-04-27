import { Label } from '@/lib/shadcn-ui/label';
import { Loader2 } from 'lucide-react';

interface AnimationSheetPreviewStepProps {
  animationSheetUrl: string | null;
  error: string | null;
  isLoading?: boolean;
}

export function AnimationSheetPreviewStep({
  animationSheetUrl,
  error,
  isLoading = false,
}: AnimationSheetPreviewStepProps) {
  if (!animationSheetUrl && !isLoading) return null;

  return (
    <div className="space-y-2">
      <Label className="text-gray-200">Confirm Animation Sheet</Label>
      <p className="text-sm text-gray-400">
        AI has generated the full animation sheet based on the sprite. Does it look correct?
      </p>
      <div className="flex justify-center p-4 border border-gray-700 rounded bg-gray-800/50 overflow-auto">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
          </div>
        ) : animationSheetUrl ? (
          <img
            src={animationSheetUrl}
            alt="Generated Animation Sheet"
            className="max-w-full h-auto image-rendering-pixelated"
          />
        ) : (
          <div className="text-gray-500 py-8">No animation sheet available</div>
        )}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
