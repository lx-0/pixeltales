import { Logger } from '@nestjs/common';
import { SpriteCoordinate } from '@pixeltales/contracts';

/**
 * Options for image generation
 */
export interface ImageGenerationOptions {
  prompt: string;
  type: 'conversation' | 'image_processing';
  images?: Array<{ role: string; image: string }>;
}

/**
 * Result of image generation
 */
export interface ImageGenerationResult {
  image: string;
}

/**
 * Options for image analysis
 */
export interface ImageAnalysisOptions {
  prompt: string;
  image: string;
  templateData?: SpriteCoordinate[];
  type: 'conversation' | 'image_processing';
}

/**
 * Result of image analysis
 */
export interface ImageAnalysisResult {
  coordinates?: SpriteCoordinate[];
  [key: string]: unknown;
}

/**
 * Provider token for the ImageLlmService
 * Use this token for dependency injection
 */
export const IMAGE_LLM_SERVICE = 'IMAGE_LLM_SERVICE';

/**
 * Abstract base class for image generation services
 * Provides common functionality and defines interface for all image LLM service implementations
 */
export abstract class BaseImageLlmService {
  protected readonly logger: Logger;

  constructor(serviceName: string) {
    this.logger = new Logger(serviceName);
  }

  /**
   * Generate an image based on a text prompt
   * @param options Generation options including prompt and type
   * @returns Generated image as a base64 string
   */
  abstract generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult>;

  /**
   * Analyze an image to extract information
   * @param options Analysis options including the image and prompt
   * @returns Analysis result, which may include coordinates or other data
   */
  abstract analyzeImage(options: ImageAnalysisOptions): Promise<ImageAnalysisResult>;

  /**
   * Clean a base64 image string by removing the prefix
   */
  protected cleanBase64Image(base64Image: string): string {
    // Remove the "data:image..." prefix if present
    return base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
  }

  /**
   * Process coordinates with proper type safety
   */
  protected processCoordinates(coordinates: unknown[]): SpriteCoordinate[] {
    return (coordinates || []).map((coord) => {
      // Create a safe object by extracting properties with proper type checking
      const safeCoord: Record<string, unknown> = (coord as Record<string, unknown>) || {};

      // Type-safe extraction of properties
      const id = typeof safeCoord.id === 'string' ? safeCoord.id : '';
      const x = typeof safeCoord.x === 'number' ? safeCoord.x : 0;
      const y = typeof safeCoord.y === 'number' ? safeCoord.y : 0;
      const width = typeof safeCoord.width === 'number' ? safeCoord.width : 0;
      const height = typeof safeCoord.height === 'number' ? safeCoord.height : 0;

      return { id, x, y, width, height };
    });
  }

  /**
   * Validate and fix a base64 string to ensure it's properly formatted
   */
  protected validateAndFixBase64(base64String: string): string {
    let fixedBase64 = base64String;

    // Trim whitespace
    fixedBase64 = fixedBase64.trim();

    // Remove any line breaks that might be in the string
    fixedBase64 = fixedBase64.replace(/[\r\n]/g, '');

    // Check if the string has valid base64 characters only
    if (!/^[A-Za-z0-9+/=]+$/.test(fixedBase64)) {
      this.logger.warn('Base64 string contains invalid characters', {
        invalidChars: fixedBase64.match(/[^A-Za-z0-9+/=]/g),
        sampleInvalidSection: fixedBase64.match(/[^A-Za-z0-9+/=].{0,10}/)?.[0],
      });

      // Remove invalid characters
      fixedBase64 = fixedBase64.replace(/[^A-Za-z0-9+/=]/g, '');
      this.logger.debug('Removed invalid characters from base64 string', {
        newLength: fixedBase64.length,
      });
    }

    // Check correct length (must be multiple of 4)
    if (fixedBase64.length % 4 !== 0) {
      this.logger.warn('Base64 string length is not a multiple of 4, it may be invalid', {
        length: fixedBase64.length,
      });

      // Try to fix padding
      while (fixedBase64.length % 4 !== 0) {
        fixedBase64 += '=';
      }
      this.logger.debug('Added padding to base64 string', { newLength: fixedBase64.length });
    }

    // Check for malformed padding
    const paddingPosition = fixedBase64.indexOf('=');
    if (paddingPosition > -1 && paddingPosition < fixedBase64.length - 2) {
      this.logger.warn('Base64 string has padding in invalid position', {
        paddingPosition,
        stringLength: fixedBase64.length,
      });

      // Remove all padding and re-add if needed
      fixedBase64 = fixedBase64.replace(/=/g, '');
      while (fixedBase64.length % 4 !== 0) {
        fixedBase64 += '=';
      }
      this.logger.debug('Fixed padding in base64 string', { newLength: fixedBase64.length });
    }

    return fixedBase64;
  }
}
