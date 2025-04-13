import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsNumber, IsString, IsBoolean, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum WatermarkPosition {
  TOP_LEFT = 'top-left',
  TOP_CENTER = 'top-center',
  TOP_RIGHT = 'top-right',
  CENTER_LEFT = 'center-left',
  CENTER = 'center',
  CENTER_RIGHT = 'center-right',
  BOTTOM_LEFT = 'bottom-left',
  BOTTOM_CENTER = 'bottom-center',
  BOTTOM_RIGHT = 'bottom-right',
}

export enum WatermarkType {
  TEXT = 'text',
  IMAGE = 'image',
}

class WatermarkColorDto {
  @ApiProperty({ description: 'Red component (0-1)', example: 0 })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  r?: number;

  @ApiProperty({ description: 'Green component (0-1)', example: 0 })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  g?: number;

  @ApiProperty({ description: 'Blue component (0-1)', example: 0 })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  b?: number;
}

class PageRangeDto {
  @ApiProperty({ description: 'Start page', example: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  start?: number;

  @ApiProperty({ description: 'End page', example: 5 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  end?: number;
}

export class WatermarkOptionsDto {
  @ApiProperty({ 
    enum: WatermarkType, 
    description: 'Type of watermark (text or image)', 
    example: WatermarkType.TEXT
  })
  @IsEnum(WatermarkType)
  type: WatermarkType;

  @ApiProperty({ description: 'Text to use as watermark', example: 'CONFIDENTIAL' })
  @IsString()
  @IsOptional()
  text?: string;

  @ApiProperty({ 
    enum: WatermarkPosition, 
    description: 'Position of watermark', 
    example: WatermarkPosition.CENTER 
  })
  @IsEnum(WatermarkPosition)
  position: WatermarkPosition;

  @ApiProperty({ description: 'Font size of watermark text', example: 48 })
  @IsNumber()
  @Min(6)
  @Max(96)
  @IsOptional()
  fontSize?: number;

  @ApiProperty({ description: 'Opacity of watermark (0-1)', example: 0.3 })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  opacity?: number;

  @ApiProperty({ type: WatermarkColorDto, description: 'Color of watermark', example: { r: 0, g: 0, b: 0 } })
  @ValidateNested()
  @Type(() => WatermarkColorDto)
  @IsOptional()
  color?: WatermarkColorDto;

  @ApiProperty({ description: 'Rotation angle in degrees', example: 45 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  rotation?: number;

  @ApiProperty({ description: 'Add to all pages', example: true })
  @IsBoolean()
  @IsOptional()
  allPages?: boolean;

  @ApiProperty({ type: PageRangeDto, description: 'Specific page range for watermarking', example: { start: 1, end: 5 } })
  @ValidateNested()
  @Type(() => PageRangeDto)
  @IsOptional()
  pageRange?: PageRangeDto;
}