import { Input } from '@/lib/shadcn-ui/input';
import { Label } from '@/lib/shadcn-ui/label';
import { Loader2 } from 'lucide-react';

// TODO: Define this structure properly based on backend response and target format
interface ExtractedSprite {
  id: string; // e.g., 'idle_right_0', 'walk_down_1'
  imageUrl?: string; // URL of the cut sprite (or could use CSS background)
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

// TODO: Define the target layout based on game requirements
const TARGET_LAYOUT = [
  { id: 'idle_down_0', row: 0, col: 0 },
  { id: 'idle_down_1', row: 0, col: 1 }, // ...etc
  { id: 'idle_left_0', row: 1, col: 0 }, // ...
  // Add all required sprite IDs and their grid positions
];
const GRID_COLS = 6; // Example: 6 sprites per row
const SPRITE_DISPLAY_WIDTH = 48; // Example width
const SPRITE_DISPLAY_HEIGHT = 96; // Example height

interface FinalPreviewStepProps {
  extractedSprites: ExtractedSprite[] | null; // Sprites cut based on coordinates
  onRegenerateIndividual?: (spriteId: string) => void; // Optional callback
  error: string | null;
  isLoading?: boolean;
  characterName?: string;
  onSetCharacterName?: (name: string) => void;
}

export function FinalPreviewStep({
  extractedSprites,
  onRegenerateIndividual,
  error,
  isLoading = false,
  characterName = '',
  onSetCharacterName,
}: FinalPreviewStepProps) {
  // Map extracted sprites to their target layout positions
  const layoutMap = new Map<string, ExtractedSprite>();
  extractedSprites?.forEach((sprite) => layoutMap.set(sprite.id, sprite));

  const gridRows = Math.ceil(TARGET_LAYOUT.length / GRID_COLS);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-gray-200">Character Name</Label>
        <Input
          value={characterName}
          onChange={(e) => onSetCharacterName?.(e.target.value)}
          placeholder="Enter a name for your character"
          className="bg-gray-800 border-gray-700 text-gray-200"
          disabled={isLoading}
        />
        <p className="text-xs text-gray-400">
          This name will be used to identify your character in the system.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-gray-200">Final Preview & Refinement</Label>
        <p className="text-sm text-gray-400">
          Sprites have been extracted and arranged. Review the final sheet. Regenerate individual
          sprites if needed (coming soon).
        </p>
        {isLoading ? (
          <div className="border border-gray-700 rounded bg-gray-800/50 p-8 flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
          </div>
        ) : extractedSprites ? (
          <div
            className="p-2 border border-gray-700 rounded bg-gray-800/50 overflow-auto grid gap-1"
            style={{
              gridTemplateColumns: `repeat(${GRID_COLS}, ${SPRITE_DISPLAY_WIDTH}px)`,
              width: `${GRID_COLS * SPRITE_DISPLAY_WIDTH + (GRID_COLS + 1) * 4}px`, // Adjust width based on cols, size, gap
            }}
          >
            {TARGET_LAYOUT.map((slot) => {
              const sprite = layoutMap.get(slot.id);
              return (
                <div
                  key={slot.id}
                  className="border border-dashed border-gray-600 flex items-center justify-center relative group"
                  style={{
                    width: `${SPRITE_DISPLAY_WIDTH}px`,
                    height: `${SPRITE_DISPLAY_HEIGHT}px`,
                    gridColumn: `${slot.col + 1} / span 1`,
                    gridRow: `${slot.row + 1} / span 1`,
                  }}
                >
                  {sprite?.imageUrl ? (
                    <img
                      src={sprite.imageUrl} // Assume imageUrl is provided for cut sprites
                      alt={slot.id}
                      title={slot.id}
                      className="max-w-full max-h-full object-contain image-rendering-pixelated"
                    />
                  ) : (
                    <span className="text-xs text-gray-500 text-center">
                      {slot.id}
                      <br />
                      (Missing)
                    </span>
                  )}
                  {/* Placeholder for regenerate button */}
                  {/* <Button
                     variant="destructive"
                     size="sm"
                     className="absolute top-0 right-0 p-1 h-auto opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                     onClick={() => onRegenerateIndividual?.(slot.id)}
                     disabled // TODO: Enable when implemented
                   >
                     X
                   </Button> */}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border border-gray-700 rounded bg-gray-800/50 p-4 flex justify-center items-center h-40">
            <p className="text-gray-500">No sprite data available</p>
          </div>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </div>
  );
}
