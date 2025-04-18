// import { Button } from '@/lib/shadcn-ui/button';
// import { cn } from '@/lib/utils';
// import { WandSparkles } from 'lucide-react';
// import React, { useCallback, useEffect, useRef, useState } from 'react';
// import Editor from 'react-simple-code-editor';
// import { PromptSuggestionType } from '../llm-forms.types';
// import { llmFormsApi } from '../services/llm-forms-api.service';
// import { PromptDialog } from './PromptDialog';

// interface LLMCodeEditorProps {
//   value: string;
//   onValueChange: (value: string) => void;
//   highlight?: (code: string) => string;
//   placeholder?: string;
//   padding?: number;
//   style?: React.CSSProperties;
//   className?: string;
//   disabled?: boolean;
//   llmFeatures?: {
//     autocomplete?: boolean;
//     promptFill?: boolean;
//     fieldType?: PromptSuggestionType;
//     fieldContext?: string;
//   };
// }

// const debounceCompletionTime = 1500;
// const minLengthForCompletion = 10;

// export const LLMCodeEditor: React.FC<LLMCodeEditorProps> = ({
//   value,
//   onValueChange,
//   highlight = (code) => code,
//   placeholder,
//   padding = 8,
//   style,
//   className,
//   disabled = false,
//   llmFeatures,
// }) => {
//   const [suggestion, setSuggestion] = useState('');
//   const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false);
//   const [isTyping, setIsTyping] = useState(false);
//   const [isFocused, setIsFocused] = useState(false);
//   const editorRef = useRef<HTMLTextAreaElement | null>(null);
//   const [currentValue, setCurrentValue] = useState(value);
//   const prevValueRef = useRef<string | null>(null);
//   const completionTimerRef = useRef<NodeJS.Timeout | null>(null);
//   const editorContainerRef = useRef<HTMLDivElement | null>(null);

//   // Clear any active timers when component unmounts
//   useEffect(() => {
//     return () => {
//       if (completionTimerRef.current) {
//         clearTimeout(completionTimerRef.current);
//       }
//     };
//   }, []);

//   // Trigger completion when necessary
//   const triggerCompletion = useCallback(async () => {
//     // Skip if not eligible for completion
//     if (
//       !llmFeatures?.autocomplete ||
//       !isFocused ||
//       !currentValue ||
//       currentValue.length < minLengthForCompletion ||
//       !document.hasFocus() // Skip if window doesn't have focus
//     ) {
//       return;
//     }

//     try {
//       const { completion = '' } = await llmFormsApi.completeText(
//         currentValue,
//         llmFeatures?.fieldContext,
//       );

//       // Only update if conditions are still valid
//       if (isFocused && completion && prevValueRef.current === currentValue && document.hasFocus()) {
//         setSuggestion(completion);
//       }
//     } catch (error) {
//       // Silent error handling to prevent console pollution
//     }
//   }, [llmFeatures?.autocomplete, isFocused, currentValue, llmFeatures?.fieldContext]);

//   // Handle typing state and debounce completion
//   useEffect(() => {
//     // Only relevant if autocomplete is enabled and focused
//     if (!llmFeatures?.autocomplete || !isFocused || !document.hasFocus()) {
//       return;
//     }

//     // If value changed, mark as typing
//     if (prevValueRef.current !== currentValue) {
//       setIsTyping(true);
//       setSuggestion('');
//       prevValueRef.current = currentValue;

//       // Clear any existing timer
//       if (completionTimerRef.current) {
//         clearTimeout(completionTimerRef.current);
//         completionTimerRef.current = null;
//       }

//       // Set up new timer if there's content
//       if (currentValue && currentValue.length >= minLengthForCompletion) {
//         completionTimerRef.current = setTimeout(() => {
//           setIsTyping(false);
//           triggerCompletion();
//         }, debounceCompletionTime);
//       }
//     }

//     return () => {
//       if (completionTimerRef.current) {
//         clearTimeout(completionTimerRef.current);
//         completionTimerRef.current = null;
//       }
//     };
//   }, [currentValue, isFocused, llmFeatures?.autocomplete, triggerCompletion]);

//   // Handle window focus/blur to prevent background completion requests
//   useEffect(() => {
//     const handleWindowBlur = () => {
//       if (completionTimerRef.current) {
//         clearTimeout(completionTimerRef.current);
//         completionTimerRef.current = null;
//       }
//     };

//     window.addEventListener('blur', handleWindowBlur);

//     return () => {
//       window.removeEventListener('blur', handleWindowBlur);
//     };
//   }, []);

//   // Handle suggestion acceptance with Tab key
//   const handleKeyDown = (e: React.KeyboardEvent) => {
//     if (e.key === 'Tab' && suggestion) {
//       e.preventDefault();
//       setCurrentValue(currentValue + suggestion);
//       onValueChange(currentValue + suggestion);
//       setSuggestion('');
//     }
//   };

//   const handleFocus = () => {
//     setIsFocused(true);

//     // If there's content, trigger completion after a delay
//     if (
//       currentValue &&
//       currentValue.length >= minLengthForCompletion &&
//       llmFeatures?.autocomplete
//     ) {
//       completionTimerRef.current = setTimeout(() => {
//         setIsTyping(false);
//         triggerCompletion();
//       }, debounceCompletionTime);
//     }
//   };

//   const handleBlur = () => {
//     setIsFocused(false);
//     setSuggestion('');
//     setIsTyping(false);
//     if (completionTimerRef.current) {
//       clearTimeout(completionTimerRef.current);
//       completionTimerRef.current = null;
//     }
//   };

//   const handleValueChange = (newValue: string) => {
//     setCurrentValue(newValue);
//     onValueChange(newValue);
//   };

//   // Alternative approach to showing suggestions - render after the editor
//   // using an absolutely positioned element
//   const showSuggestionOverlay = suggestion && isFocused && !isTyping;

//   return (
//     <div className="relative group">
//       <div
//         ref={editorContainerRef}
//         className={cn(
//           'relative rounded-md border border-input bg-transparent',
//           'hover:border-ring/60',
//           'focus-within:outline-none focus-within:ring-1 focus-within:ring-ring focus-within:border-ring',
//           className,
//         )}
//       >
//         <Editor
//           className={cn('text-sm', className)}
//           value={value}
//           onValueChange={handleValueChange}
//           highlight={highlight}
//           padding={padding}
//           style={{
//             paddingRight: '2.5rem', // Add proper padding for button
//             ...style,
//           }}
//           textareaClassName="focus:outline-none"
//           onKeyDown={handleKeyDown}
//           onFocus={handleFocus}
//           onBlur={handleBlur}
//           disabled={disabled}
//           placeholder={placeholder}
//         />

//         {/* Overlay suggestion display - improved positioning and styling */}
//         {showSuggestionOverlay && (
//           <div
//             className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none overflow-auto"
//             data-testid="suggestion-overlay"
//             style={
//               {
//                 scrollTop: editorRef.current?.scrollTop || 0,
//               } as React.CSSProperties
//             }
//           >
//             <div
//               className={cn('absolute left-0 right-0 w-full h-full', 'text-sm whitespace-pre-line')}
//               style={{
//                 paddingRight: `calc(2.5rem + ${padding}px)`, // Match editor's right padding plus button space
//                 paddingTop: `${padding}px`,
//                 paddingLeft: `${padding}px`,
//                 paddingBottom: `${padding}px`,
//               }}
//             >
//               {/* <span className="text-red-500">{currentValue}</span> */}
//               <span className="invisible">{currentValue}</span>
//               <wbr />
//               <span className="text-primary/80">{suggestion}</span>
//             </div>
//           </div>
//         )}

//         {llmFeatures?.promptFill && (
//           <Button
//             type="button"
//             variant="ghost"
//             size="icon"
//             className="absolute right-1.5 top-1.5 h-6 w-6 bg-white dark:bg-slate-800 border border-primary text-primary hover:bg-primary/10 shadow-sm"
//             onClick={() => setIsPromptDialogOpen(true)}
//           >
//             <WandSparkles className="h-4 w-4" />
//           </Button>
//         )}
//       </div>

//       {/* Use shared PromptDialog component */}
//       <PromptDialog
//         open={isPromptDialogOpen}
//         onOpenChange={setIsPromptDialogOpen}
//         onGenerate={onValueChange}
//         currentText={currentValue}
//         fieldType={llmFeatures?.fieldType}
//       />
//     </div>
//   );
// };
