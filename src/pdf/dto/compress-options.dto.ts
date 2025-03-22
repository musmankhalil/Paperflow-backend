import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsNumber, IsEnum, Min, Max } from 'class-validator';

export enum ImageCompressionLevel {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  MAXIMUM = 'maximum'
}

export class CompressOptionsDto {
  @ApiProperty({
    description: 'Image compression level to apply',
    enum: ImageCompressionLevel,
    default: ImageCompressionLevel.MEDIUM,
    required: false
  })
  @IsOptional()
  @IsEnum(ImageCompressionLevel)
  imageCompression?: ImageCompressionLevel;

  @ApiProperty({ 
    description: 'JPEG image quality (1-100, lower means more compression)', 
    default: 75,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  imageQuality?: number;

  @ApiProperty({ 
    description: 'Whether to downsample images to reduce file size',
    default: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  downsampleImages?: boolean;

  @ApiProperty({ 
    description: 'Target DPI for downsampled images (72-300)',
    default: 150,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(72)
  @Max(300)
  downsampleDpi?: number;

  @ApiProperty({ 
    description: 'Whether to remove metadata to reduce file size',
    default: false,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  removeMetadata?: boolean;

  @ApiProperty({ 
    description: 'Whether to flatten form fields',
    default: false,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  flattenFormFields?: boolean;
  
  @ApiProperty({ 
    description: 'Whether to combine duplicate image resources',
    default: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  deduplicateImages?: boolean;
}