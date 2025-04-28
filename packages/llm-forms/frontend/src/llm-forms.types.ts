export enum PromptSuggestionType {
  Description = 'description',
  SystemPrompt = 'system_prompt',
  WelcomeMessage = 'welcome_message',
  ImagePrompt = 'image_prompt',
  AgentDescription = 'agent_description',
}

/**
 * Response from form LLM operations
 */
export interface LlmFormsResponse {
  /**
   * Text completion
   */
  completion?: string;

  /**
   * Generated text
   */
  text?: string;

  /**
   * Generated image URL
   */
  url?: string;

  /**
   * Prompt suggestions
   */
  suggestions?: string[];
}

/**
 * Response from image upload
 */
export interface ImageUploadResponse {
  /**
   * Uploaded image ID
   */
  id: string;

  /**
   * URL to the icon version
   */
  iconUrl: string;

  /**
   * URL to the thumbnail version
   */
  thumbnailUrl: string;
}
