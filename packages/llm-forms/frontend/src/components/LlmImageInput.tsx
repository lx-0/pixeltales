import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@yesterday-ai/shadcn-ui';
import { AuthenticatedImage } from '@yesterday-ai/supabase-storage-frontend';
import { ImageIcon, Loader2, RefreshCcw, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { PromptSuggestionType } from '../llm-forms.types';
import { llmFormsApi } from '../services/llm-forms-api.service';

export interface Image {
  id: string;
  original_path: string;
  normal_path: string;
  thumbnail_path: string;
  icon_path: string;
  mime_type: string;
  created_at: string;
  updated_at: string;
}

interface LLMImageInputProps {
  value?: Pick<Image, 'id' | 'icon_path' | 'thumbnail_path' | 'mime_type'>;
  onChange?: (value: string | null) => void;
  onRemove?: () => void;
  className?: string;
  placeholder?: string;
  showInput?: boolean;
}

const maxUploadFileSize = 5 * 1024 * 1024; // 5MB
const apiImageRoute = 'images/serve';

type Tabs = 'upload' | 'url' | 'generate';

export const LLMImageInput: React.FC<LLMImageInputProps> = ({
  value,
  onChange,
  onRemove,
  className,
  placeholder = 'Select or generate an image',
  showInput = true,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tabs>('upload');
  const [imageUrl, setImageUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [promptSuggestions, setPromptSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    value?.thumbnail_path ? `${apiImageRoute}/${value.thumbnail_path}` : null,
  );
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState<string | null>(null);

  // Load prompt suggestions when dialog opens
  React.useEffect(() => {
    if (isDialogOpen) {
      llmFormsApi
        .getPromptSuggestions(PromptSuggestionType.ImagePrompt)
        .then(({ suggestions = [] }) => setPromptSuggestions(suggestions))
        .catch(() => {
          setPromptSuggestions([]);
        });
    } else {
      setGeneratedUrl(null);
    }
  }, [isDialogOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > maxUploadFileSize) {
        setError('File size must be less than 5MB');
        return;
      }

      try {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        setPreviewUrl(base64Data);
        if (onChange) {
          onChange(base64Data);
        }
        setIsDialogOpen(false);
        setError(null);
      } catch (err) {
        setError('Error reading file');
      }
    }
  };

  const handleUrlSubmit = async () => {
    if (!imageUrl) return;

    try {
      new URL(imageUrl);
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      setPreviewUrl(base64Data);
      if (onChange) {
        onChange(base64Data);
      }
      setIsDialogOpen(false);
      setError(null);
    } catch {
      setError('Please enter a valid URL');
    }
  };

  const handlePromptGenerate = async (promptToUse = prompt) => {
    if (!promptToUse) return;

    // Set loading state for the specific prompt
    if (promptToUse === prompt) {
      setIsLoading(true);
    } else {
      setLoadingSuggestion(promptToUse);
    }

    setError(null);
    try {
      const { url = '' } = await llmFormsApi.generateImage(promptToUse);
      setGeneratedUrl(url || null);
    } catch (error: unknown) {
      console.error('Error generating image:', error);
      // Try to extract the error message from the response
      let errorMessage = 'Failed to generate image. Please try again.';
      if (error instanceof Error && error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setLoadingSuggestion(null);
    }
  };

  const handleApplyGenerated = () => {
    if (generatedUrl) {
      setPreviewUrl(generatedUrl);
      if (onChange) {
        onChange(generatedUrl);
      }
      setIsDialogOpen(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    if (onChange) onChange(null);
    if (onRemove) onRemove();
  };

  if (!showInput && !previewUrl) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn('h-20 w-20 relative', previewUrl ? 'p-0 overflow-hidden' : '', className)}
            onClick={() => showInput && setIsDialogOpen(true)}
          >
            {previewUrl ? (
              <AuthenticatedImage
                src={previewUrl}
                alt="Selected"
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="h-8 w-8" />
            )}
          </Button>
          {previewUrl && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="h-6 w-6 absolute -top-2 -right-2 rounded-full"
              onClick={handleRemove}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
        {showInput && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-20 text-xs text-muted-foreground"
            onClick={() => setIsDialogOpen(true)}
          >
            {previewUrl ? 'Change Image' : placeholder}
          </Button>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setGeneratedUrl(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Image</DialogTitle>
          </DialogHeader>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tabs)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="url">URL</TabsTrigger>
              <TabsTrigger value="generate">Generate</TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Input type="file" accept="image/*" onChange={handleFileUpload} />
              </div>
            </TabsContent>
            <TabsContent value="url" className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Input
                  type="url"
                  placeholder="Enter image URL"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
                <Button onClick={handleUrlSubmit} disabled={!imageUrl}>
                  Use URL
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="generate" className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Input
                  type="text"
                  placeholder="Describe the image you want to generate"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
                <Button
                  onClick={() => handlePromptGenerate()}
                  disabled={isLoading || !prompt}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Image'
                  )}
                </Button>

                {generatedUrl && (
                  <div className="mt-4 space-y-3">
                    <div className="aspect-square w-full overflow-hidden rounded-md border">
                      <img
                        src={generatedUrl}
                        alt="Generated"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex gap-2">
                      {isLoading ? (
                        <Button disabled className="flex-1">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Regenerating...
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handlePromptGenerate()}
                          variant="outline"
                          className="flex-1"
                        >
                          <RefreshCcw className="mr-2 h-4 w-4" />
                          Regenerate
                        </Button>
                      )}
                      <Button onClick={handleApplyGenerated} className="flex-1">
                        Use This Image
                      </Button>
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <h4 className="mb-2 text-sm font-medium">Try these prompts:</h4>
                  <div className="flex flex-wrap gap-2">
                    {promptSuggestions.map((suggestion, i) => (
                      <Button
                        key={i}
                        size="sm"
                        variant="outline"
                        onClick={() => handlePromptGenerate(suggestion)}
                        disabled={isLoading || loadingSuggestion !== null}
                      >
                        {loadingSuggestion === suggestion && (
                          <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        )}
                        <span>{suggestion}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};
