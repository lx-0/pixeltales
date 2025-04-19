import { spritesheetApi } from '@/lib/api';
import { Button } from '@/lib/shadcn-ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/lib/shadcn-ui/dialog';
import { Logger } from '@/utils/logger';
import { SpriteCoordinate, SPRITESHEET_STRUCTURES } from '@pixeltales/contracts';
import { useEffect, useState } from 'react';
import { AnimationSheetPreviewStep } from './generation-steps/AnimationSheetPreviewStep';
import { CoordinatePreviewStep } from './generation-steps/CoordinatePreviewStep';
import { FinalPreviewStep } from './generation-steps/FinalPreviewStep';
import { GeneratingStep } from './generation-steps/GeneratingStep';
import { PromptStep } from './generation-steps/PromptStep';
import { StepsIndicator } from './generation-steps/StepsIndicator';

// Define the steps in the generation process
export type GenerationStep =
  | 'prompt'
  | 'generating_base_sprite'
  | 'animation_sheet_generating'
  | 'animation_sheet_preview'
  | 'coordinate_extraction_generating'
  | 'coordinate_extraction_preview'
  | 'final_preview_generating'
  | 'final_preview'
  | 'complete';

interface CharacterGenerationDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onGenerationComplete: (newSpritesheetKey: string) => void;
}

// Structure based on backend response
interface ExtractedSprite {
  id: string;
  imageUrl?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

// Step-specific instruction texts
const stepInstructions: Record<GenerationStep, string> = {
  prompt: "Describe your character's appearance to generate a unique sprite using AI.",
  generating_base_sprite: 'Creating your character sprite based on the provided description...',
  animation_sheet_preview: 'Review the animation sheet generated for your character.',
  animation_sheet_generating:
    'Creating an animation sheet with all necessary poses and directions...',
  coordinate_extraction_preview: 'Review the identified sprite coordinates on the animation sheet.',
  coordinate_extraction_generating:
    'Analyzing the animation sheet to extract individual sprites...',
  final_preview: 'Review the final sprite collection before finalizing.',
  final_preview_generating: 'Preparing the individual sprites for the final collection...',
  complete: 'Character generation complete!',
};

export function CharacterGenerationDialog({
  isOpen,
  onOpenChange,
  onGenerationComplete,
}: CharacterGenerationDialogProps) {
  const [currentStep, setCurrentStep] = useState<GenerationStep>('prompt');
  const [prompt, setPrompt] = useState<string>('');
  const [generatedSpriteUrl, setGeneratedSpriteUrl] = useState<string | null>(null);
  const [generatedSpriteId, setGeneratedSpriteId] = useState<string | null>(null);
  const [generatedAnimationSheetUrl, setGeneratedAnimationSheetUrl] = useState<string | null>(null);
  const [extractedCoordinates, setExtractedCoordinates] = useState<SpriteCoordinate[] | null>(null);
  const [extractedSprites, setExtractedSprites] = useState<ExtractedSprite[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [characterName, setCharacterName] = useState<string>('');

  // Reset state when dialog is closed or opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('prompt');
      setPrompt('');
      setGeneratedSpriteUrl(null);
      setGeneratedSpriteId(null);
      setGeneratedAnimationSheetUrl(null);
      setExtractedCoordinates(null);
      setExtractedSprites(null);
      setCharacterName(`Character_${Date.now()}`); // Default character name with timestamp
      setIsLoading(false);
      setError(null);
    }
  }, [isOpen]);

  const handleGenerateBaseSprite = async () => {
    if (!prompt) {
      setError('Please enter a description for the character.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setCurrentStep('generating_base_sprite');

    try {
      // Create a sprite reference using the base sprite location from the character spritesheet structure
      const spriteRef = {
        type: 'character' as const,
        location: SPRITESHEET_STRUCTURES.character.baseSprite, // [19, 0]
        spriteSheetId: 'bob', // Default to Bob sprite
      };

      // Log the sprite reference to verify it's correctly created
      Logger.info('CharacterGenerationDialog', 'Sending sprite reference to API', {
        spriteRef: JSON.stringify(spriteRef),
        baseLocation: JSON.stringify(SPRITESHEET_STRUCTURES.character.baseSprite),
      });

      const result = await spritesheetApi.generateBaseSprite(prompt, spriteRef);

      Logger.info('CharacterGenerationDialog', 'API response received', {
        success: result.success,
        hasData: !!result.data,
        hasImage: result.data?.image ? 'Yes' : 'No',
        statusCode: result.statusCode,
        message: result.message,
      });

      if (!result.success || !result.data?.image) {
        setError(result.error || 'Failed to generate base sprite. Please try again.');
        setCurrentStep('prompt');
        return;
      }

      // Clear any previous errors and set the image
      setError(null);
      setGeneratedSpriteUrl(result.data.image);
      setCurrentStep('prompt'); // Return to prompt step with the generated image

      Logger.info('CharacterGenerationDialog', 'Base sprite generated successfully', {
        imageLength: result.data.image.length || 0,
      });
    } catch (err) {
      Logger.error('CharacterGenerationDialog', 'Error generating base sprite', err);
      setError('Failed to generate base sprite. Please try again.');
      setCurrentStep('prompt');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAnimationSheet = async () => {
    if (!generatedSpriteUrl) return;
    setIsLoading(true);
    setError(null);
    setCurrentStep('animation_sheet_generating');

    try {
      const result = await spritesheetApi.generateAnimationSheet(generatedSpriteUrl);
      if (!result.success || !result.data?.image) {
        setError(result.error || 'Failed to generate animation sheet. Please try again.');
        setCurrentStep('prompt');
        return;
      }

      setGeneratedAnimationSheetUrl(result.data.image);
      setCurrentStep('animation_sheet_preview');
    } catch (err) {
      Logger.error('CharacterGenerationDialog', 'Error generating animation sheet', err);
      setError('Failed to generate animation sheet. Please try again.');
      setCurrentStep('prompt'); // Go back to prompt step
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtractCoordinates = async () => {
    if (!generatedAnimationSheetUrl) return;
    setIsLoading(true);
    setError(null);
    setCurrentStep('coordinate_extraction_generating');

    try {
      const result = await spritesheetApi.extractCoordinates(generatedAnimationSheetUrl);
      if (!result.success || !result.data?.coordinates) {
        setError(result.error || 'Failed to extract coordinates. Please try again.');
        setCurrentStep('animation_sheet_preview');
        return;
      }

      setExtractedCoordinates(result.data.coordinates);
      setCurrentStep('coordinate_extraction_preview');
    } catch (err) {
      Logger.error('CharacterGenerationDialog', 'Error extracting coordinates', err);
      setError('Failed to extract coordinates. Please try again.');
      setCurrentStep('animation_sheet_preview'); // Go back
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrepareFinalPreview = async () => {
    if (!generatedAnimationSheetUrl || !extractedCoordinates) return;
    setIsLoading(true);
    setError(null);
    setCurrentStep('final_preview_generating');

    try {
      // Convert coordinates to sprites for preview
      const sprites = extractedCoordinates.map((coord) => ({
        id: coord.id,
        imageUrl: generatedAnimationSheetUrl, // Will be cut client-side for preview
        x: coord.x,
        y: coord.y,
        width: coord.width,
        height: coord.height,
      }));

      setExtractedSprites(sprites);
      setCurrentStep('final_preview');
    } catch (err) {
      Logger.error('CharacterGenerationDialog', 'Error preparing final preview', err);
      setError('Failed to prepare final preview. Please try again.');
      setCurrentStep('coordinate_extraction_preview'); // Go back
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!generatedAnimationSheetUrl || !extractedCoordinates || !characterName) {
      setError('Missing required data to finalize character');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await spritesheetApi.finalizeSpritesheet(
        generatedAnimationSheetUrl,
        extractedCoordinates,
        characterName,
      );
      if (!result.success || !result.data?.filename) {
        setError(result.error || 'Failed to finalize spritesheet. Please try again.');
        setCurrentStep('final_preview');
        return;
      }

      // Pass the filename back to the parent
      onGenerationComplete(result.data.filename);
      onOpenChange(false);
    } catch (err) {
      Logger.error('CharacterGenerationDialog', 'Error finalizing spritesheet', err);
      setError('Failed to finalize spritesheet. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get current instruction text based on step
  const getInstructionText = () => {
    return (
      stepInstructions[currentStep] ||
      'Follow the steps to generate a unique character spritesheet using AI.'
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'prompt':
      case 'generating_base_sprite':
        return (
          <PromptStep
            prompt={prompt}
            setPrompt={setPrompt}
            error={error}
            generatedSpriteUrl={generatedSpriteUrl}
            showPreview={true}
            isLoading={isLoading}
          />
        );
      case 'animation_sheet_generating':
        return (
          <GeneratingStep
            stepNumber={2}
            stepTitle="Generating Animation Sheet..."
            baseSpriteUrl={generatedSpriteUrl}
          />
        );
      case 'animation_sheet_preview':
        return (
          <AnimationSheetPreviewStep
            animationSheetUrl={generatedAnimationSheetUrl}
            error={error}
            isLoading={isLoading}
          />
        );
      case 'coordinate_extraction_generating':
        return <GeneratingStep stepNumber={3} stepTitle="Extracting Sprite Coordinates..." />;
      case 'coordinate_extraction_preview':
        return (
          <CoordinatePreviewStep
            animationSheetUrl={generatedAnimationSheetUrl}
            extractedCoordinates={extractedCoordinates}
            error={error}
            isLoading={isLoading}
          />
        );
      case 'final_preview_generating':
        return <GeneratingStep stepNumber={4} stepTitle="Preparing Final Preview..." />;
      case 'final_preview':
        return (
          <FinalPreviewStep
            extractedSprites={extractedSprites}
            error={error}
            isLoading={isLoading}
            onSetCharacterName={setCharacterName}
            characterName={characterName}
          />
        );
      default:
        return <p className="text-gray-400">Unknown step: {currentStep}</p>;
    }
  };

  const renderFooterButtons = () => {
    switch (currentStep) {
      case 'prompt':
      case 'generating_base_sprite':
        return (
          <>
            {generatedSpriteUrl ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleGenerateBaseSprite}
                  disabled={isLoading || !prompt}
                  className="bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700"
                >
                  {isLoading ? 'Regenerating...' : 'Regenerate'}
                </Button>
                <Button
                  onClick={handleGenerateAnimationSheet}
                  disabled={isLoading}
                  className="bg-gray-700 text-gray-200 hover:bg-gray-600"
                >
                  Confirm & Generate Sheet
                </Button>
              </>
            ) : (
              <Button
                onClick={handleGenerateBaseSprite}
                disabled={isLoading || !prompt}
                className="bg-gray-700 text-gray-200 hover:bg-gray-600"
              >
                {isLoading ? 'Generating...' : 'Generate Character'}
              </Button>
            )}
          </>
        );
      case 'animation_sheet_preview':
        return (
          <>
            <Button
              variant="outline"
              onClick={handleGenerateAnimationSheet}
              disabled={isLoading}
              className="bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700"
            >
              {isLoading ? 'Generating...' : 'Regenerate Sheet'}
            </Button>
            <Button
              onClick={handleExtractCoordinates}
              disabled={isLoading}
              className="bg-gray-700 text-gray-200 hover:bg-gray-600"
            >
              Confirm & Extract Coordinates
            </Button>
          </>
        );
      case 'coordinate_extraction_preview':
        return (
          <>
            <Button
              variant="outline"
              onClick={handleExtractCoordinates}
              disabled={isLoading}
              className="bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700"
            >
              {isLoading ? 'Extracting...' : 'Re-extract Coordinates'}
            </Button>
            <Button
              onClick={handlePrepareFinalPreview}
              disabled={isLoading}
              className="bg-gray-700 text-gray-200 hover:bg-gray-600"
            >
              Confirm & Prepare Final Preview
            </Button>
          </>
        );
      case 'final_preview':
        return (
          <>
            <Button
              onClick={handleFinalize}
              disabled={isLoading || !characterName}
              className="bg-green-700 text-white hover:bg-green-600"
            >
              {isLoading ? 'Finalizing...' : 'Finalize Character'}
            </Button>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl bg-gray-900">
        <DialogHeader>
          <DialogTitle>Generate New Character Sprite</DialogTitle>
        </DialogHeader>

        <div className="pt-4 pb-2 border-b border-gray-700">
          <StepsIndicator currentStep={currentStep} />
        </div>

        <DialogDescription className="text-gray-400 pt-2 text-center">
          {getInstructionText()}
        </DialogDescription>

        <div className="space-y-4 py-4 min-h-[250px]">{renderStepContent()}</div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700"
          >
            Cancel
          </Button>
          <div className="flex gap-2 justify-end">{renderFooterButtons()}</div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
