import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsNumber, IsString, IsBoolean, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PageNumberPosition } from '../services/pdf-number-pages.service';

class FontColorDto {
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

export class PageNumberOptionsDto {
  @ApiProperty({ 
    enum: PageNumberPosition, 
    description: 'Position of page numbers', 
    example: PageNumberPosition.BOTTOM_CENTER 
  })
  @IsEnum(PageNumberPosition)
  position: PageNumberPosition;

  @ApiProperty({ description: 'Number to start counting from', example: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  startNumber?: number;

  @ApiProperty({ description: 'Text to display before the page number', example: 'Page ' })
  @IsString()
  @IsOptional()
  prefix?: string;

  @ApiProperty({ description: 'Text to display after the page number', example: ' of 10' })
  @IsString()
  @IsOptional()
  suffix?: string;

  @ApiProperty({ description: 'Font size of page numbers', example: 12 })
  @IsNumber()
  @Min(6)
  @Max(72)
  @IsOptional()
  fontSize?: number;

  @ApiProperty({ description: 'Opacity of page numbers (0-1)', example: 1.0 })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  opacity?: number;

  @ApiProperty({ type: FontColorDto, description: 'Font color of page numbers', example: { r: 0, g: 0, b: 0 } })
  @ValidateNested()
  @Type(() => FontColorDto)
  @IsOptional()
  fontColor?: FontColorDto;

  @ApiProperty({ description: 'Margin from page edge (in points)', example: 25 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  margin?: number;

  @ApiProperty({ description: 'Skip adding page number to the first page', example: false })
  @IsBoolean()
  @IsOptional()
  skipFirstPage?: boolean;

  @ApiProperty({ description: 'Skip adding page number to the last page', example: false })
  @IsBoolean()
  @IsOptional()
  skipLastPage?: boolean;

  @ApiProperty({ type: PageRangeDto, description: 'Specific page range for numbering', example: { start: 1, end: 5 } })
  @ValidateNested()
  @Type(() => PageRangeDto)
  @IsOptional()
  pageRange?: PageRangeDto;
}
