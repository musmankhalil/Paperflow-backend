import { IsEnum, IsNumber, IsBoolean, IsOptional, ValidateNested, IsObject, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ImageFormat, ImageQuality } from '../services/pdf-to-image.service';

export class PageRangeDto {
  @ApiProperty({ required: false, description: 'Starting page number (1-based)', example: 1 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  from?: number;

  @ApiProperty({ required: false, description: 'Ending page number (1-based)', example: 5 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  to?: number;
}

export class ConvertToImageDto {
  @ApiProperty({ 
    enum: ImageFormat, 
    default: ImageFormat.JPG,
    description: 'Output image format'
  })
  @IsEnum(ImageFormat)
  @IsOptional()
  format?: ImageFormat;

  @ApiProperty({ 
    oneOf: [
      { enum: Object.values(ImageQuality) },
      { type: 'number', minimum: 1, maximum: 100 }
    ],
    default: ImageQuality.MEDIUM,
    description: 'Image quality setting or a number from 1-100'
  })
  @IsOptional()
  quality?: ImageQuality | number;

  @ApiProperty({ 
    type: Number,
    required: false, 
    description: 'Output resolution in DPI (dots per inch)',
    example: 150
  })
  @IsNumber()
  @IsOptional()
  @Min(72)
  @Max(1200)
  dpi?: number;

  @ApiProperty({
    required: false,
    description: 'Range of pages to convert',
    type: PageRangeDto
  })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => PageRangeDto)
  pageRange?: PageRangeDto;

  @ApiProperty({
    required: false,
    description: 'Specific page numbers to convert (1-based indexing)',
    type: [Number],
    example: [1, 3, 5]
  })
  @IsArray()
  @IsOptional()
  specificPages?: number[];

  @ApiProperty({
    required: false,
    description: 'Convert to grayscale',
    default: false
  })
  @IsOptional()
  grayscale?: any;  // Changed from boolean to any to handle string input

  @ApiProperty({
    required: false,
    description: 'Enable transparency (PNG only)',
    default: false
  })
  @IsOptional()
  transparent?: any;  // Changed from boolean to any to handle string input

  @ApiProperty({
    required: false,
    description: 'Crop images to content boundaries',
    default: false
  })
  @IsOptional()
  cropToContent?: any;  // Changed from boolean to any to handle string input
}
