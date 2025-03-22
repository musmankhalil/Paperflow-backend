import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsBoolean, IsObject, IsString, IsNumber, IsArray, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum SlideQuality {
  DRAFT = 'draft',
  STANDARD = 'standard',
  HIGH = 'high',
  PREMIUM = 'premium',
}

export enum TextExtractionMode {
  PRESERVE_LAYOUT = 'preserveLayout',
  REFLOW = 'reflow',
  SMART = 'smart',
}

export enum ImageHandling {
  EXCLUDE = 'exclude',
  INCLUDE_LOW_RES = 'includeLowRes',
  INCLUDE_HIGH_RES = 'includeHighRes',
  VECTORIZE = 'vectorize',
}

export class ThemeOptions {
  @ApiProperty({
    description: 'Custom theme name to apply to the presentation',
    example: 'modern',
    required: false,
  })
  @IsOptional()
  @IsString()
  themeName?: string;

  @ApiProperty({
    description: 'Primary color for the theme (hex format)',
    example: '#336699',
    required: false,
  })
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @ApiProperty({
    description: 'Secondary color for the theme (hex format)',
    example: '#CCDDEE',
    required: false,
  })
  @IsOptional()
  @IsString()
  secondaryColor?: string;

  @ApiProperty({
    description: 'Font family for titles',
    example: 'Arial',
    required: false,
  })
  @IsOptional()
  @IsString()
  titleFont?: string;

  @ApiProperty({
    description: 'Font family for body text',
    example: 'Calibri',
    required: false,
  })
  @IsOptional()
  @IsString()
  bodyFont?: string;
}

export class SlideOptions {
  @ApiProperty({
    description: 'Aspect ratio for slides',
    example: '16:9',
    required: false,
    enum: ['4:3', '16:9', '16:10'],
  })
  @IsOptional()
  @IsString()
  aspectRatio?: string;

  @ApiProperty({
    description: 'Maximum number of content items per slide',
    example: 6,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  maxItemsPerSlide?: number;

  @ApiProperty({
    description: 'Add slide numbers to presentation',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  addSlideNumbers?: boolean;

  @ApiProperty({
    description: 'Add footer text to each slide',
    example: 'Company Confidential',
    required: false,
  })
  @IsOptional()
  @IsString()
  footerText?: string;
}

export class AdvancedPptxOptions {
  @ApiProperty({
    description: 'Try to create a table of contents slide',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  generateTableOfContents?: boolean;

  @ApiProperty({
    description: 'Try to detect and preserve charts as editable objects',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  preserveCharts?: boolean;

  @ApiProperty({
    description: 'Create speaker notes from detected annotations or comments',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  createSpeakerNotes?: boolean;

  @ApiProperty({
    description: 'Attempt to create a bulleted list from paragraphs',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  createBulletedLists?: boolean;

  @ApiProperty({
    description: 'Try to optimize image quality vs file size',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  optimizeImageQuality?: boolean;

  @ApiProperty({
    description: 'Add animations to slide elements',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  addAnimations?: boolean;

  @ApiProperty({
    description: 'Add slide transitions',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  addTransitions?: boolean;
}

export class ConvertToPptxDto {
  @ApiProperty({
    description: 'Slide quality setting',
    enum: SlideQuality,
    default: SlideQuality.STANDARD,
    required: false,
  })
  @IsOptional()
  @IsEnum(SlideQuality)
  quality?: SlideQuality;

  @ApiProperty({
    description: 'Text extraction method',
    enum: TextExtractionMode,
    default: TextExtractionMode.SMART,
    required: false,
  })
  @IsOptional()
  @IsEnum(TextExtractionMode)
  textMode?: TextExtractionMode;

  @ApiProperty({
    description: 'Image handling mode',
    enum: ImageHandling,
    default: ImageHandling.INCLUDE_HIGH_RES,
    required: false,
  })
  @IsOptional()
  @IsEnum(ImageHandling)
  imageHandling?: ImageHandling;

  @ApiProperty({
    description: 'Theme and appearance options',
    type: ThemeOptions,
    required: false,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ThemeOptions)
  theme?: ThemeOptions;

  @ApiProperty({
    description: 'Slide layout and formatting options',
    type: SlideOptions,
    required: false,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SlideOptions)
  slideOptions?: SlideOptions;

  @ApiProperty({
    description: 'Advanced conversion options',
    type: AdvancedPptxOptions,
    required: false,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AdvancedPptxOptions)
  advanced?: AdvancedPptxOptions;

  @ApiProperty({
    description: 'Specific page numbers to include in conversion (leave empty for all pages)',
    type: [Number],
    required: false,
    example: [1, 3, 5],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  pageSelection?: number[];

  @ApiProperty({
    description: 'Add presentation metadata like title, author, etc.',
    type: Object,
    required: false,
    example: { title: 'Converted Presentation', author: 'PaperFlow API' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;
}
