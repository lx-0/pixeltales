import { Label, Textarea } from '@yesterday-ai/shadcn-ui';
import { SPRITESHEET_STRUCTURES, SPRITESHEETS } from '@yesterday-ai/spritesheet-contracts';
import { addPathPrefix, getFrameStyle } from '@yesterday-ai/spritesheet-frontend';
import { Loader2 } from 'lucide-react';

interface PromptStepProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  error: string | null;
  generatedSpriteUrl: string | null;
  showPreview?: boolean;
  isLoading?: boolean;
}

export function PromptStep({
  prompt,
  setPrompt,
  error,
  generatedSpriteUrl,
  showPreview = false,
  isLoading = false,
}: PromptStepProps) {
  // Base sprite used for generation - same as in CharacterSpriteSelector
  const filename = SPRITESHEETS.character.find((c) => c.id === 'bob')?.filename;
  const baseSpritePath = filename ? addPathPrefix(filename) : undefined;

  if (!baseSpritePath) {
    throw new Error('Base sprite path not found');
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Label htmlFor="prompt-input" className="text-gray-200">
          Describe your character
        </Label>
        <Textarea
          id="prompt-input"
          placeholder="e.g., A young knight with shining armor, A mysterious sorceress in dark robes..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[100px] bg-gray-800 border-gray-700 text-gray-200 placeholder:text-gray-500"
        />

        <div className="flex flex-col md:flex-row gap-4 items-start mt-3">
          <div className="flex flex-col items-center">
            <p className="text-xs text-gray-400 mb-2">Base sprite used for generation:</p>
            <div className="border border-gray-700 rounded bg-gray-800/50 p-2 flex items-center justify-center w-20">
              <div className="w-12 h-24 overflow-hidden">
                <div
                  className="image-rendering-pixelated"
                  style={getFrameStyle(SPRITESHEET_STRUCTURES.character, baseSpritePath, 1)}
                />
              </div>
            </div>
          </div>

          <div className="flex-1">
            <p className="text-xs text-gray-400 mb-2">Generated result:</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex flex-col items-center">
                <div className="border border-gray-700 rounded bg-gray-800/50 p-2 flex items-center justify-center w-20 h-32">
                  {isLoading ? (
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  ) : generatedSpriteUrl && showPreview ? (
                    <img
                      src={generatedSpriteUrl}
                      alt="Generated Character (1x)"
                      className="image-rendering-pixelated w-12"
                    />
                  ) : (
                    <div className="text-xs text-gray-500 text-center">Not generated yet</div>
                  )}
                </div>
                <span className="text-xs text-gray-500 mt-1">1x</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="border border-gray-700 rounded bg-gray-800/50 p-2 flex items-center justify-center w-40 h-32">
                  {isLoading ? (
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  ) : generatedSpriteUrl && showPreview ? (
                    <img
                      src={generatedSpriteUrl}
                      alt="Generated Character (3x)"
                      className="image-rendering-pixelated w-36"
                    />
                  ) : (
                    <div className="text-xs text-gray-500 text-center">Not generated yet</div>
                  )}
                </div>
                <span className="text-xs text-gray-500 mt-1">3x</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
