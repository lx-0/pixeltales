import { BaseApiService } from '@yesterday-ai/api-frontend';
import { LlmFormsResponse, PromptSuggestionType } from '../llm-forms.types';

/**
 * Service for scene-related API requests
 */
export class LlmFormsApi extends BaseApiService {
  constructor() {
    super(LlmFormsApi.constructor.name);
  }

  /**
   * Complete text using form LLM
   */
  async completeText(text: string, context?: string): Promise<LlmFormsResponse> {
    return this.post<LlmFormsResponse>('/form-llm/complete', { text, context }).catch((error) => {
      console.error('[API-DEBUG] Complete text error:', error);
      throw error;
    });
  }

  /**
   * Generate text from prompt
   */
  async generateFromPrompt(prompt: string, context?: string): Promise<LlmFormsResponse> {
    return this.post<LlmFormsResponse>('/form-llm/generate', {
      prompt,
      context,
    }).catch((error) => {
      console.error('[API-DEBUG] Generate from prompt error:', error);
      throw error;
    });
  }

  /**
   * Generate image from prompt
   */
  async generateImage(prompt: string): Promise<LlmFormsResponse> {
    return this.post<LlmFormsResponse>('/form-llm/generate-image', { prompt }).catch((error) => {
      console.error('[API-DEBUG] Generate image error:', error);
      throw error;
    });
  }

  /**
   * Get prompt suggestions by type
   */
  async getPromptSuggestions(type: PromptSuggestionType): Promise<LlmFormsResponse> {
    return this.get<LlmFormsResponse>(`/form-llm/prompt-suggestions?type=${type}`).catch(
      (error) => {
        console.error('[API-DEBUG] Get prompt suggestions error:', error);
        throw error;
      },
    );
  }
}

// Export singleton instance
export const llmFormsApi = new LlmFormsApi();
