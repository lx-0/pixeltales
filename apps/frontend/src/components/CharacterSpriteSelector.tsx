import { Button } from '@/lib/shadcn-ui/button';
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/lib/shadcn-ui/form';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/lib/shadcn-ui/select';
import { addPathPrefix, getFrameStyle } from '@/lib/spritesheet';
import { SPRITESHEETS, SPRITESHEET_STRUCTURES } from '@pixeltales/contracts';
import { useState } from 'react';
import { CharacterGenerationDialog } from './CharacterGenerationDialog';

// Simple presets for display
const PREVIEW_SCALE = 0.5; // Scale down by half for the preview
const PREVIEW_SELECTION_SCALE = 0.3;

interface CharacterSpriteSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function CharacterSpriteSelector({ value, onChange }: CharacterSpriteSelectorProps) {
  // TODO: Implement upload and generation logic
  const [isGenerationDialogOpen, setIsGenerationDialogOpen] = useState(false);

  // Find the selected spritesheet object to display its name and preview
  const selectedSheet = SPRITESHEETS.character.find((sheet) => sheet.id === value);

  const handleUpload = () => {
    console.warn('Upload functionality not yet implemented.');
    // Trigger file input or drag-and-drop interface
  };

  const handleGenerate = () => {
    setIsGenerationDialogOpen(true);
  };

  return (
    <FormItem>
      <FormLabel className="text-gray-200">Character Sprite</FormLabel>
      <div className="flex items-center gap-2">
        <Select onValueChange={onChange} value={value}>
          <FormControl>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-200">
              <SelectValue placeholder="Select a spritesheet">
                {selectedSheet ? (
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-12 flex-shrink-0 rounded-sm overflow-hidden flex items-center justify-center">
                      <div
                        className="image-rendering-pixelated"
                        style={{
                          ...getFrameStyle(
                            SPRITESHEET_STRUCTURES.character,
                            addPathPrefix(selectedSheet.filename),
                            PREVIEW_SELECTION_SCALE,
                          ),
                        }}
                      />
                    </div>
                    <span>{selectedSheet.name}</span>
                  </div>
                ) : (
                  'Select a spritesheet'
                )}
              </SelectValue>
            </SelectTrigger>
          </FormControl>
          <SelectContent className="bg-gray-800 border-gray-700 text-gray-200">
            <SelectGroup>
              <SelectLabel className="text-gray-400">Predefined Sprites</SelectLabel>
              {SPRITESHEETS.character.map((sheet) => (
                <SelectItem key={sheet.id} value={sheet.id}>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-12 flex-shrink-0 rounded-sm overflow-hidden flex items-center justify-center">
                      <div
                        className="image-rendering-pixelated"
                        style={{
                          ...getFrameStyle(
                            SPRITESHEET_STRUCTURES.character,
                            addPathPrefix(sheet.filename),
                            PREVIEW_SCALE,
                          ),
                        }}
                      />
                    </div>
                    <span>{sheet.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
            {/* TODO: Add sections for uploaded/generated sprites */}
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" onClick={handleUpload} disabled>
          Upload
        </Button>
        <Button type="button" variant="outline" onClick={handleGenerate}>
          Generate
        </Button>
      </div>
      <FormDescription className="text-gray-400">
        Choose a predefined sprite, or upload/generate a new one (coming soon).
      </FormDescription>
      <FormMessage />
      <CharacterGenerationDialog
        isOpen={isGenerationDialogOpen}
        onOpenChange={setIsGenerationDialogOpen}
        onGenerationComplete={(newSpritesheetKey: string) => {
          // TODO: Add the new key to availableSpritesheets (or refetch config)
          // For now, just select it
          onChange(newSpritesheetKey);
          setIsGenerationDialogOpen(false);
        }}
      />
    </FormItem>
  );
}
