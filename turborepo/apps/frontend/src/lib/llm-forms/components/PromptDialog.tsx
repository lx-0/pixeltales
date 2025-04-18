import { Button } from '@/lib/shadcn-ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/lib/shadcn-ui/dialog';
import { Input } from '@/lib/shadcn-ui/input';
import React, { useEffect, useState } from 'react';
import { PromptSuggestionType } from '../llm-forms.types';
import { llmFormsApi } from '../services/llm-forms-api.service';

interface PromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (text: string) => void;
  currentText: string;
  fieldType?: PromptSuggestionType;
}

export const PromptDialog: React.FC<PromptDialogProps> = ({
  open,
  onOpenChange,
  onGenerate,
  currentText,
  fieldType,
}) => {
  const [prompt, setPrompt] = useState('');
  const [promptSuggestions, setPromptSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load prompt suggestions when dialog opens
  useEffect(() => {
    if (open && fieldType) {
      llmFormsApi
        .getPromptSuggestions(fieldType)
        .then(({ suggestions = [] }) => setPromptSuggestions(suggestions))
        .catch(console.error);
    }
  }, [open, fieldType]);

  // Reset prompt when dialog closes
  useEffect(() => {
    if (!open) {
      setPrompt('');
    }
  }, [open]);

  // Handle prompt generation
  const handlePromptGenerate = async () => {
    if (!prompt) return;

    setIsLoading(true);
    try {
      const { text = '' } = await llmFormsApi.generateFromPrompt(prompt, currentText);
      onGenerate(text);
      onOpenChange(false);
    } catch (error) {
      console.error('Error generating text:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Content</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Input
              placeholder="Enter your prompt..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <div className="text-sm text-muted-foreground">Try these suggestions:</div>
            <div className="flex flex-wrap gap-2">
              {promptSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setPrompt(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handlePromptGenerate} disabled={!prompt || isLoading}>
              {isLoading ? 'Generating...' : 'Generate'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
