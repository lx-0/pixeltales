import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import {
  ExtractCoordinatesDto,
  FinalizeSpriteSheetDto,
  GenerateAnimationSheetDto,
  GenerateBaseSpriteDto,
  RegenerateSpriteDto,
  SpriteCoordinateDto,
  SpriteReference,
  SpritesheetType,
} from '@pixeltales/contracts';
import { BaseImageLlmService, IMAGE_LLM_SERVICE } from '@yesterday-ai/llm-backend';
import { ImageEditorService } from '../image-editor/image-editor.service';

@Injectable()
export class SpritesheetService {
  private readonly logger = new Logger(SpritesheetService.name);

  constructor(
    @Inject(IMAGE_LLM_SERVICE)
    private readonly imageLlmService: BaseImageLlmService,
    private readonly imageEditor: ImageEditorService,
  ) {}

  /**
   * Generate a base sprite from a text prompt or reference sprite
   */
  async generateBaseSprite(dto: GenerateBaseSpriteDto): Promise<string> {
    this.logger.log(`Generating base sprite from prompt: ${dto.prompt.substring(0, 20)}...`);

    // Add detailed logging about the received DTO
    this.logger.log(
      `Received DTO: ${JSON.stringify({
        prompt: dto.prompt.substring(0, 30) + '...',
        hasSpriteReference: !!dto.spriteReference,
        spriteReference: dto.spriteReference ? JSON.stringify(dto.spriteReference) : 'null',
      })}`,
    );

    try {
      // Check if a valid sprite reference is provided
      const validRef = this.isValidSpriteReference(dto.spriteReference);
      this.logger.log(`Sprite reference validation result: ${validRef ? 'Valid' : 'Invalid'}`);

      // Generate base sprite using LLM
      let referenceSpriteBase64: string | undefined;

      // If a valid reference is provided, extract the sprite to use as reference
      if (validRef) {
        this.logger.log(`Using reference sprite: ${JSON.stringify(validRef)}`);
        try {
          referenceSpriteBase64 = await this.imageEditor.extractSpriteByReference(validRef);
          this.logger.log(
            `Successfully extracted reference sprite. Base64 length: ${
              referenceSpriteBase64 ? referenceSpriteBase64.length : 0
            }`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to extract sprite by reference: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
          throw new BadRequestException(
            `Failed to extract sprite by reference: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }

      // Generate new sprite using LLM and the reference (if available)
      this.logger.log(
        `Generating new sprite from prompt${
          referenceSpriteBase64 ? ' and reference sprite' : ''
        } using LLM`,
      );

      const result = await this.imageLlmService.generateImage({
        prompt: `Pixel art character: ${dto.prompt}. Simple, top-down view, 32x32 pixels, RPG style, transparent background.`,
        images: referenceSpriteBase64
          ? [{ role: 'reference_sprite', image: referenceSpriteBase64 }]
          : undefined,
        type: 'image_processing',
      });

      return result.image;
    } catch (error) {
      this.logger.error(
        `Failed to generate base sprite: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException('Failed to generate base sprite');
    }
  }

  /**
   * Validate a sprite reference
   */
  private isValidSpriteReference(ref: unknown): SpriteReference | null {
    if (!ref || typeof ref !== 'object') {
      this.logger.log(`Invalid sprite reference: ${ref ? 'Not an object' : 'Null or undefined'}`);
      return null;
    }

    const r = ref as Record<string, unknown>;
    this.logger.log(
      `Validating sprite reference: ${JSON.stringify({
        hasType: typeof r.type === 'string',
        hasLocation: Array.isArray(r.location),
        locationLength: Array.isArray(r.location) ? r.location.length : 'N/A',
        hasValidXY:
          Array.isArray(r.location) &&
          r.location.length === 2 &&
          typeof r.location[0] === 'number' &&
          typeof r.location[1] === 'number',
        spriteSheetIdType: r.spriteSheetId === undefined ? 'undefined' : typeof r.spriteSheetId,
      })}`,
    );

    if (
      typeof r.type === 'string' &&
      Array.isArray(r.location) &&
      r.location.length === 2 &&
      typeof r.location[0] === 'number' &&
      typeof r.location[1] === 'number' &&
      (r.spriteSheetId === undefined || typeof r.spriteSheetId === 'string')
    ) {
      return {
        type: r.type as unknown as SpritesheetType,
        location: r.location as [number, number],
        spriteSheetId: r.spriteSheetId,
      };
    }

    return null;
  }

  /**
   * Generate an animation sheet from a base sprite
   */
  async generateAnimationSheet(dto: GenerateAnimationSheetDto): Promise<string> {
    this.logger.log('Generating animation sheet');

    try {
      // Get the template animation sheet to use as reference
      const templateSheet = await this.imageEditor.getTemplateAnimationSheet();

      // Use the LLM service to generate the animation sheet
      const result = await this.imageLlmService.generateImage({
        prompt:
          'Generate a complete animation spritesheet matching the template layout exactly, ' +
          'but using the provided character design. Maintain exact pixel positions and animation style.',
        images: [
          { role: 'base_character', image: dto.baseSprite },
          { role: 'template_sheet', image: templateSheet },
        ],
        type: 'image_processing',
      });

      return result.image;
    } catch (error) {
      this.logger.error(
        `Failed to generate animation sheet: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException('Failed to generate animation sheet');
    }
  }

  /**
   * Extract sprite coordinates from an animation sheet
   */
  async extractCoordinates(dto: ExtractCoordinatesDto): Promise<SpriteCoordinateDto[]> {
    this.logger.log('Extracting sprite coordinates');

    try {
      // Get the template coordinates for reference
      const templateCoordinates = await this.imageEditor.getTemplateCoordinates();

      // Use the LLM service to extract coordinates
      const result = await this.imageLlmService.analyzeImage({
        prompt:
          'Analyze this animation spritesheet and extract the exact coordinates of each sprite. ' +
          'Match the sprite IDs from the template. Return structured JSON with x, y, width, height for each sprite ID.',
        image: dto.animationSheet,
        templateData: templateCoordinates,
        type: 'image_processing',
      });

      // Convert raw coordinates to DTOs
      const coordinates = result.coordinates || [];
      return coordinates.map((coord) => {
        const dto = new SpriteCoordinateDto();
        dto.id = coord.id;
        dto.x = coord.x;
        dto.y = coord.y;
        dto.width = coord.width;
        dto.height = coord.height;
        return dto;
      });
    } catch (error) {
      this.logger.error(
        `Failed to extract coordinates: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException('Failed to extract sprite coordinates');
    }
  }

  /**
   * Regenerate a specific sprite based on feedback
   */
  async regenerateSprite(dto: RegenerateSpriteDto): Promise<string> {
    this.logger.log(`Regenerating sprite: ${dto.spriteId}`);

    try {
      // Get the template sprite for reference
      const templateSprite = await this.imageEditor.getTemplateSprite(dto.spriteId);

      // Use the LLM service to regenerate the sprite
      const result = await this.imageLlmService.generateImage({
        prompt:
          `Regenerate just this single sprite (${dto.spriteId}) to match the template pose exactly, ` +
          `but using the character design from the base sprite. ${dto.feedback || ''}`,
        images: [
          { role: 'base_character', image: dto.baseSprite },
          { role: 'template_sprite', image: templateSprite },
        ],
        type: 'image_processing',
      });

      return result.image;
    } catch (error) {
      this.logger.error(
        `Failed to regenerate sprite: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException('Failed to regenerate sprite');
    }
  }

  /**
   * Finalize and save the spritesheet
   */
  async finalizeSpritesheet(dto: FinalizeSpriteSheetDto): Promise<string> {
    this.logger.log(`Finalizing spritesheet for character: ${dto.characterName}`);

    try {
      return await this.imageEditor.assembleAndSaveSpritesheet(
        dto.animationSheet,
        dto.coordinates,
        dto.characterName,
      );
    } catch (error) {
      this.logger.error(
        `Failed to finalize spritesheet: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException('Failed to finalize spritesheet');
    }
  }

  /**
   * Extract a single sprite from an animation sheet using its coordinates
   * @param animationSheetBase64 The base64-encoded animation sheet image
   * @param coordinate The coordinates of the sprite to extract
   * @returns The base64-encoded extracted sprite
   */
  async extractSpriteFromSheet(
    animationSheetBase64: string,
    coordinate: SpriteCoordinateDto,
  ): Promise<string> {
    this.logger.log(`Extracting sprite with ID: ${coordinate.id} from animation sheet`);

    try {
      // Convert base64 to buffer
      const imageBuffer = Buffer.from(animationSheetBase64, 'base64');

      // Extract the sprite using ImageEditorService
      const spriteBuffer = await this.imageEditor.extractSprite(imageBuffer, coordinate);

      // Convert back to base64
      return spriteBuffer.toString('base64');
    } catch (error) {
      this.logger.error(
        `Failed to extract sprite: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(`Failed to extract sprite with ID: ${coordinate.id}`);
    }
  }
}
