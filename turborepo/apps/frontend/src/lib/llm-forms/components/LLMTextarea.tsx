import { Button } from '@/lib/shadcn-ui/button';
import { Textarea, TextareaProps } from '@/lib/shadcn-ui/textarea';
import { cn } from '@/lib/utils';
import { WandSparkles } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PromptSuggestionType } from '../llm-forms.types';
import { llmFormsApi } from '../services/llm-forms-api.service';
import { PromptDialog } from './PromptDialog';

interface LLMTextareaProps extends TextareaProps {
  llmFeatures?: {
    autocomplete?: boolean;
    promptFill?: boolean;
    fieldType?: PromptSuggestionType;
    fieldContext?: string;
  };
  value?: string;
  onValueChange?: (value: string) => void;
}

const debounceCompletionTime = 1500;
const minLengthForCompletion = 10;

export const LLMTextarea = React.forwardRef<HTMLTextAreaElement, LLMTextareaProps>(
  ({ className, llmFeatures, value, onChange, onValueChange, ...props }, ref) => {
    const [suggestion, setSuggestion] = useState('');
    const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const [currentValue, setCurrentValue] = useState<string | undefined>(value);
    const prevValueRef = useRef<string | null>(null);
    const completionTimerRef = useRef<NodeJS.Timeout | null>(null);

    const mergedRef = (node: HTMLTextAreaElement) => {
      textareaRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    // Clear any active timers when component unmounts
    useEffect(() => {
      return () => {
        if (completionTimerRef.current) {
          clearTimeout(completionTimerRef.current);
        }
      };
    }, []);

    // Trigger completion when necessary
    const triggerCompletion = useCallback(async () => {
      // Skip if not eligible for completion
      if (
        !llmFeatures?.autocomplete ||
        !isFocused ||
        !currentValue ||
        currentValue.length < minLengthForCompletion ||
        !document.hasFocus() // Skip if window doesn't have focus
      ) {
        return;
      }

      try {
        const { completion = '' } = await llmFormsApi.completeText(
          currentValue ?? '',
          llmFeatures?.fieldContext,
        );

        // Only update if conditions are still valid
        if (
          isFocused &&
          completion &&
          prevValueRef.current === currentValue &&
          document.hasFocus()
        ) {
          setSuggestion(completion);
        }
      } catch (error) {
        // Silent error handling to prevent console pollution
      }
    }, [llmFeatures?.autocomplete, isFocused, currentValue]);

    // Handle typing state and debounce completion
    useEffect(() => {
      // Only relevant if autocomplete is enabled and focused
      if (!llmFeatures?.autocomplete || !isFocused || !document.hasFocus()) {
        return;
      }

      // If value changed, mark as typing
      if (prevValueRef.current !== currentValue) {
        setIsTyping(true);
        setSuggestion('');
        prevValueRef.current = currentValue ?? '';

        // Clear any existing timer
        if (completionTimerRef.current) {
          clearTimeout(completionTimerRef.current);
          completionTimerRef.current = null;
        }

        // Set up new timer if there's content
        if (currentValue && (currentValue as string).length >= minLengthForCompletion) {
          completionTimerRef.current = setTimeout(() => {
            setIsTyping(false);
            triggerCompletion();
          }, debounceCompletionTime);
        }
      }

      return () => {
        if (completionTimerRef.current) {
          clearTimeout(completionTimerRef.current);
          completionTimerRef.current = null;
        }
      };
    }, [currentValue, isFocused, llmFeatures?.autocomplete, triggerCompletion]);

    // Handle window focus/blur to prevent background completion requests
    useEffect(() => {
      const handleWindowBlur = () => {
        if (completionTimerRef.current) {
          clearTimeout(completionTimerRef.current);
          completionTimerRef.current = null;
        }
      };

      window.addEventListener('blur', handleWindowBlur);

      return () => {
        window.removeEventListener('blur', handleWindowBlur);
      };
    }, []);

    // Handle suggestion acceptance with Tab key
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Tab' && suggestion) {
        e.preventDefault();
        const newValue = currentValue + suggestion;
        console.log('Accepting suggestion, new textarea value:', {
          newValue,
          currentValue,
          suggestion,
        });
        setCurrentValue(newValue);
        if (onValueChange) {
          onValueChange(newValue);
        } else if (onChange) {
          const event = {
            target: { value: newValue, name: props.name },
          } as React.ChangeEvent<HTMLTextAreaElement>;
          onChange(event);
        }
        setSuggestion('');
      }
    };

    // Focus/blur handlers
    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true);

      // If there's content, trigger completion after a delay
      if (
        currentValue &&
        currentValue.length >= minLengthForCompletion &&
        llmFeatures?.autocomplete &&
        document.hasFocus()
      ) {
        completionTimerRef.current = setTimeout(() => {
          setIsTyping(false);
          triggerCompletion();
        }, debounceCompletionTime);
      }

      if (props.onFocus) {
        props.onFocus(e);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false);
      setSuggestion('');

      if (props.onBlur) {
        props.onBlur(e);
      }
    };

    // Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCurrentValue(e.target.value);
      // Let the useEffect handle the typing state
      if (onChange) onChange(e);
      if (onValueChange) onValueChange(e.target.value);
      setSuggestion('');
    };

    // Handle generated text from prompt dialog
    const handleGeneratedText = (text: string) => {
      if (onValueChange) {
        onValueChange(text);
      } else if (onChange) {
        const event = {
          target: { value: text, name: props.name },
        } as React.ChangeEvent<HTMLTextAreaElement>;
        onChange(event);
      }
    };

    // Extract onFocus and onBlur from props to prevent them from being passed twice
    const { onFocus, onBlur, ...restProps } = props;

    return (
      <div className="relative">
        {/* Wand button - positioned outside of textarea container to avoid hiding */}
        {llmFeatures?.promptFill && (
          <div className="absolute right-2 top-2 z-20 pointer-events-auto">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 bg-white dark:bg-slate-800 border border-primary text-primary hover:bg-primary/10 shadow-sm"
              onClick={() => setIsPromptDialogOpen(true)}
            >
              <WandSparkles className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="relative">
          {/* The actual textarea with user input */}
          <Textarea
            ref={mergedRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={cn('pr-10', className)} // Increased right padding for the icon
            {...restProps}
          />

          {/* Show the suggestion using a simpler approach */}
          {suggestion && isFocused && !isTyping && (
            <div
              className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none overflow-hidden"
              data-testid="suggestion-overlay"
            >
              <div
                className={cn(
                  'absolute left-0 top-0 w-full h-full',
                  'pl-3 py-2 pr-10 text-sm whitespace-pre-line',
                  'break-words',
                  className,
                )}
              >
                {/* <span className="text-red-500">{currentValue}</span> */}
                <span className="invisible">{currentValue}</span>
                <wbr />
                <span className="text-primary/80">{suggestion}</span>
              </div>
            </div>
          )}
        </div>

        {/* Use the shared PromptDialog component */}
        <PromptDialog
          open={isPromptDialogOpen}
          onOpenChange={setIsPromptDialogOpen}
          onGenerate={handleGeneratedText}
          currentText={currentValue ?? ''}
          fieldType={llmFeatures?.fieldType}
        />
      </div>
    );
  },
);

LLMTextarea.displayName = 'LLMTextarea';
