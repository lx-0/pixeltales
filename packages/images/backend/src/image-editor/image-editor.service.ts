import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SpriteCoordinate,
  SpriteCoordinateDto,
  SpriteCoordinateSchema,
  SpriteReference,
  SPRITESHEET_STRUCTURES,
  SPRITESHEETS,
  SpritesheetType,
} from '@yesterday-ai/spritesheet-contracts';
import * as fs from 'node:fs';
import * as path from 'path';
import sharp from 'sharp';
import { z } from 'zod';

@Injectable()
export class ImageEditorService {
  private readonly logger = new Logger(ImageEditorService.name);
  private readonly assetsDir: string;
  private readonly templatesDir: string;
  private readonly outputDir: string;
  private readonly assetsPath: string;

  constructor(private configService: ConfigService) {
    this.assetsDir = path.join(process.cwd(), 'assets');
    this.templatesDir = path.join(this.assetsDir, 'templates');
    this.outputDir = path.join(this.assetsDir, 'generated');
    this.assetsPath =
      this.configService.get<string>('ASSETS_PATH') ||
      path.join(process.cwd(), '..', 'frontend', 'public', 'assets');
    this.logger.log(`Assets path: ${this.assetsPath}`);

    // Ensure directories exist
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    const dirs = [this.assetsDir, this.templatesDir, this.outputDir];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  /**
   * Get the template animation sheet
   */
  async getTemplateAnimationSheet(): Promise<string> {
    try {
      const filePath = path.join(this.templatesDir, 'template_sheet.png');
      const data = await fs.promises.readFile(filePath);
      return Buffer.from(data).toString('base64');
    } catch (error) {
      this.logger.error(
        'Failed to read template animation sheet',
        error instanceof Error ? error.message : String(error),
      );
      throw new Error('Template animation sheet not found');
    }
  }

  /**
   * Get the template coordinates
   */
  async getTemplateCoordinates(): Promise<SpriteCoordinateDto[]> {
    try {
      const filePath = path.join(this.templatesDir, 'coordinates.json');
      const data = await fs.promises.readFile(filePath, 'utf8');

      // Parse the JSON data
      const rawCoordinates = z.array(SpriteCoordinateSchema).parse(JSON.parse(data));

      // Convert to DTOs
      return rawCoordinates.map((coord) => {
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
        'Failed to read template coordinates',
        error instanceof Error ? error.message : String(error),
      );
      throw new Error('Template coordinates not found');
    }
  }

  /**
   * Get a specific template sprite
   */
  async getTemplateSprite(spriteId: string): Promise<string> {
    try {
      const filePath = path.join(this.templatesDir, `${spriteId}.png`);
      const data = await fs.promises.readFile(filePath);
      return Buffer.from(data).toString('base64');
    } catch (error) {
      this.logger.error(
        `Failed to read template sprite: ${spriteId}`,
        error instanceof Error ? error.message : String(error),
      );
      throw new Error(`Template sprite ${spriteId} not found`);
    }
  }

  /**
   * Assemble and save the final spritesheet
   */
  async assembleAndSaveSpritesheet(
    sheetBase64: string,
    coordinates: SpriteCoordinateDto[],
    characterName: string,
  ): Promise<string> {
    const sanitizedName = characterName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const timestamp = Date.now();
    const filename = `${sanitizedName}_${timestamp}.png`;
    const outputPath = path.join(this.outputDir, filename);

    try {
      // For now, just save the full sheet as is
      // In a real implementation, this would cut and assemble sprites based on coordinates
      const imageBuffer = Buffer.from(sheetBase64, 'base64');
      await fs.promises.writeFile(outputPath, imageBuffer);

      // Also save the coordinates for reference
      const coordsPath = path.join(this.outputDir, `${sanitizedName}_${timestamp}_coords.json`);
      await fs.promises.writeFile(coordsPath, JSON.stringify(coordinates, null, 2));

      this.logger.log(`Saved spritesheet to ${outputPath}`);
      return filename;
    } catch (error) {
      this.logger.error(
        'Failed to save spritesheet',
        error instanceof Error ? error.message : String(error),
      );
      throw new Error('Failed to save spritesheet');
    }
  }

  /**
   * Gets the absolute file path for a spritesheet
   * @param type The type of spritesheet (character, object, background)
   * @param spriteSheetId The ID of the spritesheet (optional)
   * @returns The absolute file path to the spritesheet
   */
  getSpriteSheetPath(type: SpritesheetType, spriteSheetId?: string): string {
    let filename: string;

    if (spriteSheetId) {
      const spritesheet = SPRITESHEETS[type]?.find((sheet) => sheet.id === spriteSheetId);

      if (!spritesheet) {
        throw new NotFoundException(
          `Spritesheet with ID ${spriteSheetId} not found for type ${type}`,
        );
      }

      filename = spritesheet.filename;
    } else {
      // Use first available spritesheet if no ID provided
      const spritesheet = SPRITESHEETS[type]?.[0];

      if (!spritesheet) {
        throw new NotFoundException(`No spritesheets found for type ${type}`);
      }

      filename = spritesheet.filename;
    }

    // Build the file path based on type
    let relativePath: string;
    switch (type) {
      case 'character':
        relativePath = path.join('characters', filename);
        break;
      case 'object':
        relativePath = path.join('objects', filename);
        break;
      case 'background':
        relativePath = path.join('backgrounds', filename);
        break;
      default:
        throw new Error(`Invalid spritesheet type: ${type as any}`);
    }

    return path.join(this.assetsPath, relativePath);
  }

  /**
   * Extracts a sprite from a spritesheet based on a SpriteReference
   * @param reference The sprite reference containing type, location, and optional spriteSheetId
   * @returns Promise with the base64-encoded extracted sprite
   */
  async extractSpriteByReference(reference: SpriteReference): Promise<string> {
    const { type, location, spriteSheetId } = reference;
    this.logger.log(
      `Extracting sprite by reference: type=${type}, location=${JSON.stringify(location)}, spriteSheetId=${spriteSheetId || 'default'}`,
    );

    try {
      const spriteSheetPath = this.getSpriteSheetPath(type, spriteSheetId);
      this.logger.log(`Resolved spritesheet path: ${spriteSheetPath}`);

      // Check if file exists
      if (!fs.existsSync(spriteSheetPath)) {
        this.logger.error(`Spritesheet file does not exist at path: ${spriteSheetPath}`);
        throw new Error(`Spritesheet file not found: ${spriteSheetPath}`);
      }

      // Get the structure for this type of spritesheet
      const structure = SPRITESHEET_STRUCTURES[type];
      if (!structure) {
        throw new NotFoundException(`No structure defined for spritesheet type: ${type}`);
      }

      // Calculate the sprite coordinates based on the location
      const [x, y] = location;
      const left = x * structure.frameWidth;
      const top = y * structure.frameHeight;
      const width = structure.frameWidth;
      const height = structure.frameHeight;

      this.logger.log(
        `Extracting at coordinates: left=${left}, top=${top}, width=${width}, height=${height}`,
      );

      // Extract the sprite from the spritesheet
      const buffer = await sharp(spriteSheetPath).extract({ left, top, width, height }).toBuffer();
      const base64Result = buffer.toString('base64');

      this.logger.log(`Successfully extracted sprite, base64 length: ${base64Result.length}`);

      // Convert to base64
      return base64Result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to extract sprite: ${errorMessage}`);
      throw new Error(`Failed to extract sprite: ${errorMessage}`);
    }
  }

  /**
   * Extracts a sprite from a spritesheet based on coordinates
   * @param imageBuffer The spritesheet buffer
   * @param coordinate The coordinates to extract
   * @returns The extracted sprite as a Buffer
   */
  async extractSprite(imageBuffer: Buffer, coordinate: SpriteCoordinate): Promise<Buffer> {
    return await sharp(imageBuffer)
      .extract({
        left: coordinate.x,
        top: coordinate.y,
        width: coordinate.width,
        height: coordinate.height,
      })
      .toBuffer();
  }

  /**
   * Creates a new spritesheet from a set of sprites
   * @param sprites List of buffers representing individual sprites
   * @param columns Number of columns in the output spritesheet
   * @param width Width of each sprite in pixels
   * @param height Height of each sprite in pixels
   * @returns Buffer containing the combined spritesheet
   */
  async createSpritesheet(
    sprites: Buffer[],
    columns: number,
    width: number,
    height: number,
  ): Promise<Buffer> {
    if (!sprites.length) {
      throw new Error('No sprites provided to create spritesheet');
    }

    const rows = Math.ceil(sprites.length / columns);
    const canvasWidth = columns * width;
    const canvasHeight = rows * height;

    // Create a blank canvas
    const canvas = sharp({
      create: {
        width: canvasWidth,
        height: canvasHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    });

    // Create composite operations for each sprite
    const compositeOperations = sprites.map((sprite, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      return {
        input: sprite,
        left: col * width,
        top: row * height,
      };
    });

    // Composite all sprites onto the canvas
    return await canvas.composite(compositeOperations).toBuffer();
  }

  /**
   * Saves an image buffer to a file
   * @param buffer The image buffer to save
   * @param filename The filename to save to (will be placed in the characters directory)
   * @returns The full path to the saved file
   */
  async saveCharacterSpritesheetToFile(buffer: Buffer, filename: string): Promise<string> {
    const charactersDir = path.join(this.assetsPath, 'characters');

    // Ensure the directory exists
    if (!fs.existsSync(charactersDir)) {
      fs.mkdirSync(charactersDir, { recursive: true });
    }

    const fullPath = path.join(charactersDir, filename);
    await fs.promises.writeFile(fullPath, buffer);
    return fullPath;
  }
}
