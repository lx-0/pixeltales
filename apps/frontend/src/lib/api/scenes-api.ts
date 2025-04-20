import { Logger } from '@/utils/logger';
import {
  ApiResponse,
  ApiResponseSchema,
  CommentPayload,
  CreateSceneConfigDTO,
  NewSceneConfig,
  SceneConfig,
  SceneConfigSchema,
  VoidApiResponse,
  VoidApiResponseSchema,
  VotePayload,
} from '@pixeltales/contracts';
import { z } from 'zod';
import { BaseApiService } from './base-api';

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
  async getProposedScenes(): Promise<SceneConfig[]> {
    Logger.info('ScenesApi', 'Getting proposed scenes');
    // We can safely cast here since the schema validation guarantees the structure
    return this.get('/scenes/proposed', undefined, z.array(SceneConfigSchema));
  }

  /**
   * Propose a new scene
   * Handles type conversion from frontend SceneConfig to CreateSceneConfigDTO
   */
  async proposeScene(sceneConfig: NewSceneConfig): Promise<SceneConfig> {
    Logger.info('ScenesApi', 'Proposing new scene');

    // Convert to CreateSceneConfigDTO by extracting only the fields we need
    const createDto: CreateSceneConfigDTO = {
      name: sceneConfig.name,
      description: sceneConfig.description,
      startCharacterId: sceneConfig.startCharacterId,
      charactersConfig: sceneConfig.charactersConfig,
      // Only include proposer_name if it's a string (not null)
      ...(typeof sceneConfig.proposerName === 'string'
        ? { proposerName: sceneConfig.proposerName }
        : {}),
    };

    return this.post('/scenes/propose', createDto, undefined, SceneConfigSchema);
  }

  /**
   * Vote on a scene proposal
   */
  async voteOnScene(
    sceneConfigId: SceneConfig['id'],
    vote: 1 | -1,
  ): Promise<ApiResponse<SceneConfig>> {
    Logger.info('ScenesApi', `Voting on scene ${sceneConfigId} with ${vote}`);
    const payload: VotePayload = { vote };

    return this.post(
      `/scenes/${sceneConfigId}/vote`,
      payload,
      undefined,
      ApiResponseSchema(SceneConfigSchema),
    );
  }

  /**
   * Add a comment to a scene proposal
   */
  async commentOnScene(
    sceneConfigId: SceneConfig['id'],
    user: string,
    comment: string,
  ): Promise<VoidApiResponse> {
    Logger.info('ScenesApi', `Adding comment to scene ${sceneConfigId}`);
    const payload: CommentPayload = { user, comment };

    return this.post(`/scenes/${sceneConfigId}/comment`, payload, undefined, VoidApiResponseSchema);
  }
}

// Export singleton instance
export const scenesApi = new ScenesApiService();
