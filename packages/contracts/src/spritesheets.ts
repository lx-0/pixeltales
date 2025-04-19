import { Direction } from '@pixeltales/database';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBase64,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import z from 'zod';

// Schema for sprite coordinates
export const SpriteCoordinateSchema = z.object({
  id: z.string().describe('The label/ID of the sprite'),
  x: z.number().describe('X position of the sprite in the sheet'),
  y: z.number().describe('Y position of the sprite in the sheet'),
  width: z.number().describe('Width of the sprite'),
  height: z.number().describe('Height of the sprite'),
});

// Schema for response with image
export const ImageResponseSchema = z.object({
  image: z.string().describe('The base64 encoded image'),
});

// Schema for response with coordinates
export const CoordinatesResponseSchema = z.object({
  coordinates: z.array(SpriteCoordinateSchema).describe('The coordinates of the sprites'),
});

// Schema for response with filename
export const FilenameResponseSchema = z.object({
  filename: z.string().describe('The filename of the generated spritesheet'),
});

// Type definitions for Zod schemas
export type SpriteCoordinate = z.infer<typeof SpriteCoordinateSchema>;
export type ImageResponse = z.infer<typeof ImageResponseSchema>;
export type CoordinatesResponse = z.infer<typeof CoordinatesResponseSchema>;
export type FilenameResponse = z.infer<typeof FilenameResponseSchema>;

export type SpritesheetType = 'character' | 'object' | 'background';
export type SpriteFrameLocation = [number, number]; // Frame index [x, y]
export type SpriteReference = {
  type: SpritesheetType;
  location: SpriteFrameLocation; // Frame index [x, y]
  spriteSheetId?: string;
};

export type Spritesheet = {
  id: string;
  name: string;
  filename: string;
};

export type SpritesheetStructures = Record<SpritesheetType, SpritesheetStructure>;

/**
 * Defines the structure and layout of a spritesheet.
 */
export interface SpritesheetStructure {
  frameWidth: number; // width of a single frame in pixels
  frameHeight: number; // height of a single frame in pixels
  columns: number; // number of columns in the spritesheet
  rows: number; // number of rows in the spritesheet
  baseSprite: SpriteFrameLocation; // location of the base sprite in the spritesheet
  animations?: Record<string, Record<Direction, SpriteFrameLocation[]>>;
}

// --- Constants ---

/**
 * Default structure for character idle animation sheets
 * Based on 1152x96 sheet with 24 frames (6 frames x 4 directions)
 */
export const SPRITESHEET_STRUCTURES: SpritesheetStructures = {
  character: {
    frameWidth: 48,
    frameHeight: 96, // Full height of each character sprite
    columns: 24,
    rows: 1,
    baseSprite: [19, 0],
    animations: {
      idle: {
        right: Array.from({ length: 6 }, (_, i) => [i, 0]),
        back: Array.from({ length: 6 }, (_, i) => [i + 6, 0]),
        left: Array.from({ length: 6 }, (_, i) => [i + 12, 0]),
        front: Array.from({ length: 6 }, (_, i) => [i + 18, 0]),
      },
      // walk: { ... }, // Future expansion
    },
  },
  object: {} as SpritesheetStructure,
  background: {} as SpritesheetStructure,
};

export const SPRITESHEETS: Record<SpritesheetType, Spritesheet[]> = {
  character: [
    {
      id: 'bob',
      name: 'Bob (Basic Male)',
      filename: 'Bob_idle_anim_48x48.png',
    },
    {
      id: 'alice',
      name: 'Alice (Cleaner Girl)',
      filename: 'Cleaner_girl_idle_anim_48x48.png',
    },
  ],
  object: [],
  background: [],
};

// --- Class-based definitions for NestJS class-transformer/validator ---

// Class version of SpriteCoordinate for class-transformer
export class SpriteCoordinateDto implements SpriteCoordinate {
  @IsString()
  id!: string;

  @IsNumber()
  x!: number;

  @IsNumber()
  y!: number;

  @IsNumber()
  width!: number;

  @IsNumber()
  height!: number;
}

// Class version of SpriteReference for validation
export class SpriteReferenceDto implements SpriteReference {
  @IsString()
  @IsIn(['character', 'object', 'background'])
  type!: SpritesheetType;

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsNumber({}, { each: true })
  location!: SpriteFrameLocation;

  @IsString()
  @IsOptional()
  spriteSheetId?: string;
}

// DTOs for API requests
export class GenerateBaseSpriteDto {
  @IsString()
  @IsNotEmpty()
  prompt!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => SpriteReferenceDto)
  spriteReference?: SpriteReferenceDto;
}

export class GenerateAnimationSheetDto {
  @IsString()
  @IsBase64()
  baseSprite!: string;
}

export class ExtractCoordinatesDto {
  @IsString()
  @IsBase64()
  animationSheet!: string;
}

export class RegenerateSpriteDto {
  @IsString()
  @IsBase64()
  baseSprite!: string;

  @IsString()
  spriteId!: string;

  @IsString()
  @IsOptional()
  feedback?: string;
}

export class FinalizeSpriteSheetDto {
  @IsString()
  @IsBase64()
  animationSheet!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpriteCoordinateDto)
  coordinates!: SpriteCoordinateDto[];

  @IsString()
  characterName!: string;
}
