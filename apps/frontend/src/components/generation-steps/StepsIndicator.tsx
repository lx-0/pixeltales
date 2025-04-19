import { cn } from '@/lib/utils';
import { CheckIcon } from 'lucide-react';
import { GenerationStep } from '../CharacterGenerationDialog';

// Map steps to their numerical order for the indicator
const mapGenerationWorkflowStepToViewActivityStep: Record<GenerationStep, number> = {
  prompt: 1,
  generating_base_sprite: 1, // Same as prompt step
  animation_sheet_generating: 2,
  animation_sheet_preview: 2,
  coordinate_extraction_generating: 3,
  coordinate_extraction_preview: 3,
  final_preview_generating: 4,
  final_preview: 4,
  complete: 5,
};

interface StepsIndicatorProps {
  currentStep: GenerationStep;
}

// Define the order and labels of steps
const stepLabels: Record<number, string> = {
  1: 'Base Sprite',
  2: 'Coordinates',
  3: 'Animation Sheet',
  4: 'Generating',
  5: 'Final Preview',
};

export function StepsIndicator({ currentStep }: StepsIndicatorProps) {
  const totalSteps = Object.keys(stepLabels).length;

  return (
    <div className="w-full my-6">
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < mapGenerationWorkflowStepToViewActivityStep[currentStep];
          const isActive = stepNumber === mapGenerationWorkflowStepToViewActivityStep[currentStep];
          const stepKey = stepNumber as keyof typeof stepLabels;

          return (
            <div key={stepNumber} className="flex flex-col items-center relative">
              {/* Step indicator circle only */}
              <div
                className={cn(
                  'w-8 h-8 flex items-center justify-center rounded-full text-sm transition-colors duration-300',
                  isActive
                    ? 'border-2 border-primary bg-background text-primary'
                    : isCompleted
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                )}
              >
                {isCompleted ? <CheckIcon className="w-5 h-5" /> : stepNumber}
              </div>

              {/* Step name */}
              <span
                className={cn(
                  'mt-2 text-xs text-center',
                  isActive
                    ? 'text-primary font-medium'
                    : isCompleted
                      ? 'text-foreground'
                      : 'text-muted-foreground',
                )}
              >
                {stepLabels[stepKey]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
