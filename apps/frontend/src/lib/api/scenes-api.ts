import { Logger } from '@/utils/logger';
import {
  ApiResponse,
  ApiResponseSchema,
  CommentPayload,
  CreateSceneConfigDTO,
  SceneConfigConfig,
  VoidApiResponse,
  VoidApiResponseSchema,
  VotePayload,
} from '@pixeltales/contracts';
import { z } from 'zod';
import { BaseApiService } from './base-api';

// Define schemas for response validation
// Note: We're creating a schema that matches the exact structure of SceneConfigConfig
// to ensure type compatibility
const sceneConfigSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  start_character_id: z.string(),
  characters_config: z.record(z.string(), z.any()),
  status: z.enum(['proposed', 'active', 'rejected']),
  system_prompt: z.string(),
  votes: z.number(), // Required field, not optional
  comments: z.array(
    z.object({
      user: z.string(),
      comment: z.string(),
      timestamp: z.string(),
    }),
  ),
  // Optional fields with proper types
  proposer_name: z.string().nullable().optional(),
  proposed_at: z.string().nullable().optional(),
});

const sceneConfigArraySchema = z.array(sceneConfigSchema);

/**
 * Service for scene-related API requests
 */
export class ScenesApiService extends BaseApiService {
  constructor() {
    super('ScenesApi');
  }

  /**
   * Get all proposed scenes
   */
  async getProposedScenes(): Promise<SceneConfigConfig[]> {
    Logger.info('ScenesApi', 'Getting proposed scenes');
    // We can safely cast here since the schema validation guarantees the structure
    return this.get('/scenes/proposed', undefined, sceneConfigArraySchema);
  }

  /**
   * Propose a new scene
   * Handles type conversion from frontend SceneConfigConfig to CreateSceneConfigDTO
   */
  async proposeScene(
    sceneConfig: Omit<SceneConfigConfig, 'id' | 'status' | 'system_prompt' | 'votes' | 'comments'>,
  ): Promise<SceneConfigConfig> {
    Logger.info('ScenesApi', 'Proposing new scene');

    // Convert to CreateSceneConfigDTO by extracting only the fields we need
    const createDto: CreateSceneConfigDTO = {
      name: sceneConfig.name,
      description: sceneConfig.description,
      start_character_id: sceneConfig.start_character_id,
      characters_config: sceneConfig.characters_config,
      // Only include proposer_name if it's a string (not null)
      ...(typeof sceneConfig.proposer_name === 'string'
        ? { proposer_name: sceneConfig.proposer_name }
        : {}),
    };

    return this.post<SceneConfigConfig>('/scenes/propose', createDto, undefined, sceneConfigSchema);
  }

  /**
   * Vote on a scene proposal
   */
  async voteOnScene(sceneConfigId: number, vote: 1 | -1): Promise<ApiResponse<SceneConfigConfig>> {
    Logger.info('ScenesApi', `Voting on scene ${sceneConfigId} with ${vote}`);
    const payload: VotePayload = { vote };

    // Type assertion to handle the mismatch
    const responseSchema = ApiResponseSchema(sceneConfigSchema);

    return this.post<ApiResponse<SceneConfigConfig>, VotePayload>(
      `/scenes/${sceneConfigId}/vote`,
      payload,
      undefined,
      responseSchema,
    );
  }

  /**
   * Add a comment to a scene proposal
   */
  async commentOnScene(
    sceneConfigId: number,
    user: string,
    comment: string,
  ): Promise<VoidApiResponse> {
    Logger.info('ScenesApi', `Adding comment to scene ${sceneConfigId}`);
    const payload: CommentPayload = { user, comment };

    return this.post<VoidApiResponse, CommentPayload>(
      `/scenes/${sceneConfigId}/comment`,
      payload,
      undefined,
      VoidApiResponseSchema,
    );
  }
}

// Export singleton instance
export const scenesApi = new ScenesApiService();
