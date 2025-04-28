import { ApiResponse, ApiResponseSchema } from '@yesterday-ai/api-contracts';
import { BaseApiService, IBaseApiServiceOptions } from '@yesterday-ai/api-frontend';
import { Logger } from '@yesterday-ai/logger-frontend';
import {
  CoordinatesResponse,
  CoordinatesResponseSchema,
  ExtractCoordinatesDto,
  FilenameResponse,
  FilenameResponseSchema,
  FinalizeSpriteSheetDto,
  GenerateAnimationSheetDto,
  GenerateBaseSpriteDto,
  ImageResponse,
  ImageResponseSchema,
  RegenerateSpriteDto,
  SpriteCoordinate,
  SpriteCoordinateDto,
  SpriteReference,
} from '@yesterday-ai/spritesheet-contracts';

/**
 * API service for interacting with the spritesheet generation endpoints
 */
export class SpritesheetApiService extends BaseApiService {
  constructor(options?: IBaseApiServiceOptions) {
    super('SpritesheetApi', options);
  }

  /**
   * Generate a base sprite from a text prompt or sprite reference
   */
  async generateBaseSprite(
    prompt: string,
    spriteReference?: SpriteReference,
  ): Promise<ApiResponse<ImageResponse>> {
    const dto: GenerateBaseSpriteDto = {
      prompt,
      spriteReference,
    };

    // Log the DTO being sent to the server
    Logger.debug('SpritesheetApiService', 'Sending request to generate base sprite', {
      dto: JSON.stringify(dto),
      hasSpriteReference: !!spriteReference,
      spriteReferenceDetails: spriteReference ? JSON.stringify(spriteReference) : 'null',
    });

    return this.post(
      '/spritesheet/generate-base-sprite',
      dto,
      undefined,
      ApiResponseSchema(ImageResponseSchema),
    );
  }

  /**
   * Generate an animation sheet based on a base sprite
   */
  async generateAnimationSheet(baseSprite: string): Promise<ApiResponse<ImageResponse>> {
    const dto: GenerateAnimationSheetDto = {
      baseSprite,
    };

    return this.post(
      '/spritesheet/generate-animation-sheet',
      dto,
      undefined,
      ApiResponseSchema(ImageResponseSchema),
    );
  }

  /**
   * Extract coordinates from an animation sheet
   */
  async extractCoordinates(animationSheet: string): Promise<ApiResponse<CoordinatesResponse>> {
    const dto: ExtractCoordinatesDto = { animationSheet };

    return this.post(
      '/spritesheet/extract-coordinates',
      dto,
      undefined,
      ApiResponseSchema(CoordinatesResponseSchema),
    );
  }

  /**
   * Regenerate a specific sprite
   */
  async regenerateSprite(
    baseSprite: string,
    spriteId: string,
    feedback?: string,
  ): Promise<ApiResponse<ImageResponse>> {
    const dto: RegenerateSpriteDto = { baseSprite, spriteId, feedback };

    return this.post(
      '/spritesheet/regenerate-sprite',
      dto,
      undefined,
      ApiResponseSchema(ImageResponseSchema),
    );
  }

  /**
   * Finalize and save the spritesheet
   */
  async finalizeSpritesheet(
    animationSheet: string,
    coordinates: SpriteCoordinate[],
    characterName: string,
  ): Promise<ApiResponse<FilenameResponse>> {
    // Convert plain coordinates to DTO format if needed
    const coordinateDtos: SpriteCoordinateDto[] = coordinates.map((coord) => ({
      id: coord.id,
      x: coord.x,
      y: coord.y,
      width: coord.width,
      height: coord.height,
    }));

    const dto: FinalizeSpriteSheetDto = {
      animationSheet,
      coordinates: coordinateDtos,
      characterName,
    };

    return this.post(
      '/spritesheet/finalize',
      dto,
      undefined,
      ApiResponseSchema(FilenameResponseSchema),
    );
  }
}

// Export singleton instance
export const spritesheetApi = new SpritesheetApiService();
