import { Body, Controller, Logger, Post } from '@nestjs/common';
import { ApiOperation as OpenApiOperation, ApiTags as OpenApiTags } from '@nestjs/swagger';
import {
  ApiResponse,
  CoordinatesResponse,
  ExtractCoordinatesDto,
  FilenameResponse,
  FinalizeSpriteSheetDto,
  GenerateAnimationSheetDto,
  GenerateBaseSpriteDto,
  ImageResponse,
  RegenerateSpriteDto,
} from '@pixeltales/contracts';
import { getMessageFromUnknownError } from '@pixeltales/utils';
import { Public } from '../auth/decorators/public.decorator';
import { SpritesheetService } from './spritesheet.service';

@OpenApiTags('spritesheet')
@Public() // TODO: Remove this in production, only logged in users can generate spritesheets
@Controller('spritesheet')
export class SpritesheetController {
  private readonly logger = new Logger(SpritesheetController.name);

  constructor(private readonly spritesheetService: SpritesheetService) {}

  @Post('generate-base-sprite')
  @OpenApiOperation({ summary: 'Generate a base sprite from a text prompt' })
  async generateBaseSprite(
    @Body() dto: GenerateBaseSpriteDto,
  ): Promise<ApiResponse<ImageResponse>> {
    this.logger.log('Received request to generate base sprite');
    this.logger.log(
      `Request DTO: ${JSON.stringify({
        prompt: dto.prompt?.substring(0, 30) + '...',
        hasSpriteReference: !!dto.spriteReference,
        spriteReference: dto.spriteReference ? JSON.stringify(dto.spriteReference) : 'null',
      })}`,
    );

    try {
      const image = await this.spritesheetService.generateBaseSprite(dto);
      return {
        statusCode: 200,
        success: true,
        message: 'Base sprite generated successfully',
        data: { image },
      };
    } catch (error) {
      this.logger.error(`Error generating base sprite: ${getMessageFromUnknownError(error)}`);
      return {
        statusCode: 500,
        success: false,
        message: getMessageFromUnknownError(error) || 'Failed to generate base sprite',
      };
    }
  }

  @Post('generate-animation-sheet')
  @OpenApiOperation({ summary: 'Generate an animation sheet based on a base sprite' })
  async generateAnimationSheet(
    @Body() dto: GenerateAnimationSheetDto,
  ): Promise<ApiResponse<ImageResponse>> {
    this.logger.log('Received request to generate animation sheet');

    try {
      const image = await this.spritesheetService.generateAnimationSheet(dto);
      return {
        statusCode: 200,
        success: true,
        message: 'Animation sheet generated successfully',
        data: { image },
      };
    } catch (error) {
      this.logger.error(`Error generating animation sheet: ${getMessageFromUnknownError(error)}`);
      return {
        statusCode: 500,
        success: false,
        message: getMessageFromUnknownError(error) || 'Failed to generate animation sheet',
      };
    }
  }

  @Post('extract-coordinates')
  @OpenApiOperation({ summary: 'Extract sprite coordinates from an animation sheet' })
  async extractCoordinates(
    @Body() dto: ExtractCoordinatesDto,
  ): Promise<ApiResponse<CoordinatesResponse>> {
    this.logger.log('Received request to extract coordinates');

    try {
      const coordinates = await this.spritesheetService.extractCoordinates(dto);
      return {
        statusCode: 200,
        success: true,
        message: 'Coordinates extracted successfully',
        data: { coordinates },
      };
    } catch (error) {
      this.logger.error(`Error extracting coordinates: ${getMessageFromUnknownError(error)}`);
      return {
        statusCode: 500,
        success: false,
        message: getMessageFromUnknownError(error) || 'Failed to extract coordinates',
      };
    }
  }

  @Post('regenerate-sprite')
  @OpenApiOperation({ summary: 'Regenerate a specific sprite' })
  async regenerateSprite(@Body() dto: RegenerateSpriteDto): Promise<ApiResponse<ImageResponse>> {
    this.logger.log(`Received request to regenerate sprite: ${dto.spriteId}`);

    try {
      const image = await this.spritesheetService.regenerateSprite(dto);
      return {
        statusCode: 200,
        success: true,
        message: 'Sprite regenerated successfully',
        data: { image },
      };
    } catch (error) {
      this.logger.error(`Error regenerating sprite: ${getMessageFromUnknownError(error)}`);
      return {
        statusCode: 500,
        success: false,
        message: getMessageFromUnknownError(error) || 'Failed to regenerate sprite',
      };
    }
  }

  @Post('finalize')
  @OpenApiOperation({ summary: 'Finalize and save spritesheet' })
  async finalizeSpritesheet(
    @Body() dto: FinalizeSpriteSheetDto,
  ): Promise<ApiResponse<FilenameResponse>> {
    this.logger.log(`Received request to finalize spritesheet for: ${dto.characterName}`);

    try {
      const filename = await this.spritesheetService.finalizeSpritesheet(dto);
      return {
        statusCode: 200,
        success: true,
        message: 'Spritesheet finalized successfully',
        data: { filename },
      };
    } catch (error) {
      this.logger.error(`Error finalizing spritesheet: ${getMessageFromUnknownError(error)}`);
      return {
        statusCode: 500,
        success: false,
        message: getMessageFromUnknownError(error) || 'Failed to finalize spritesheet',
      };
    }
  }
}
