import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum SplitMode {
  PAGES = 'pages',
  RANGES = 'ranges',
  EVERY_N_PAGES = 'everyNPages',
  BOOKMARKS = 'bookmarks',
}

/**
 * @description Swagger documentation for SplitMode enum
 */
export const SplitModeDescription = {
  [SplitMode.PAGES]: 'Split at specific page numbers',
  [SplitMode.RANGES]: 'Split based on specified page ranges',
  [SplitMode.EVERY_N_PAGES]: 'Split every N pages',
  [SplitMode.BOOKMARKS]: 'Split based on bookmarks/outline items',
};

export class PageRange {
  @ApiProperty({ example: 1, description: 'Start page (inclusive)' })
  @IsNumber()
  start: number;

  @ApiProperty({ example: 5, description: 'End page (inclusive)' })
  @IsNumber()
  end: number;
}

export class SplitOptionsDto {
  @ApiProperty({ 
    enum: SplitMode, 
    default: SplitMode.PAGES, 
    description: 'Mode to use for splitting the PDF',
    enumName: 'SplitMode',
    example: SplitMode.PAGES,
    examples: {
      [SplitMode.PAGES]: {
        value: SplitMode.PAGES,
        description: SplitModeDescription[SplitMode.PAGES]
      },
      [SplitMode.RANGES]: {
        value: SplitMode.RANGES,
        description: SplitModeDescription[SplitMode.RANGES]
      },
      [SplitMode.EVERY_N_PAGES]: {
        value: SplitMode.EVERY_N_PAGES,
        description: SplitModeDescription[SplitMode.EVERY_N_PAGES]
      },
      [SplitMode.BOOKMARKS]: {
        value: SplitMode.BOOKMARKS,
        description: SplitModeDescription[SplitMode.BOOKMARKS]
      }
    }
  })
  @IsEnum(SplitMode)
  @IsOptional()
  mode?: SplitMode = SplitMode.PAGES;

  @ApiProperty({ 
    description: 'Split at these specific page numbers (1-based)', 
    example: [3, 5, 8], 
    required: false 
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  pages?: number[];

  @ApiProperty({
    description: 'Array of page ranges to extract as separate PDFs',
    type: [PageRange],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PageRange)
  @IsOptional()
  ranges?: PageRange[];

  @ApiProperty({
    description: 'Split every N pages (used with everyNPages mode)',
    example: 2,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  everyNPages?: number;

  @ApiProperty({
    description: 'Whether to include bookmark information in split PDFs (if available)',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  preserveBookmarks?: boolean;

  @ApiProperty({
    description: 'Prefix for output filenames',
    example: 'chapter',
    required: false,
  })
  @IsString()
  @IsOptional()
  filenamePrefix?: string;
}
