import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsBoolean, IsObject, IsString, IsNumber, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum PptxPdfQuality {
  DRAFT = 'draft',
  STANDARD = 'standard',
  HIGH = 'high',
  PREMIUM = 'premium',
}

export enum PptxPdfCompliance {
  PDF_1_5 = 'pdf-1.5',
  PDF_1_6 = 'pdf-1.6',
  PDF_1_7 = 'pdf-1.7',
  PDF_A_1B = 'pdf/a-1b',
  PDF_A_2B = 'pdf/a-2b',
  PDF_A_3B = 'pdf/a-3b',
}

export enum PptxImageHandling {
  PRESERVE = 'preserve',
  OPTIMIZE = 'optimize',
  COMPRESS = 'compress',
}

export class PptxPdfSlideOptionsDto {
  @ApiProperty({ 
    description: 'Whether to include slide numbers in the PDF', 
    required: false,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  includeSlideNumbers?: boolean;

  @ApiProperty({ 
    description: 'Whether to include slide notes in the PDF', 
    required: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  includeNotes?: boolean;

  @ApiProperty({ 
    description: 'Whether to include hidden slides in the PDF', 
    required: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  includeHiddenSlides?: boolean;

  @ApiProperty({ 
    description: 'Whether to include slide animations in the PDF (when supported)', 
    required: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  includeAnimations?: boolean;
}

export class PptxPdfSecurityDto {
  @ApiProperty({ 
    description: 'Whether to encrypt the PDF file', 
    required: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  encrypt?: boolean;

  @ApiProperty({ 
    description: 'User password for opening the PDF', 
    required: false 
  })
  @IsOptional()
  @IsString()
  userPassword?: string;

  @ApiProperty({ 
    description: 'Owner password for PDF editing permissions', 
    required: false 
  })
  @IsOptional()
  @IsString()
  ownerPassword?: string;

  @ApiProperty({ 
    description: 'Whether to allow printing the PDF', 
    required: false,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  allowPrinting?: boolean;

  @ApiProperty({ 
    description: 'Whether to allow copying content from the PDF', 
    required: false,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  allowCopying?: boolean;

  @ApiProperty({ 
    description: 'Whether to allow editing the PDF', 
    required: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  allowEditing?: boolean;
}

export class PptxPdfMetadataDto {
  @ApiProperty({ 
    description: 'Title of the PDF document', 
    required: false 
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ 
    description: 'Author of the PDF document', 
    required: false 
  })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiProperty({ 
    description: 'Subject of the PDF document', 
    required: false 
  })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty({ 
    description: 'Keywords for the PDF document', 
    required: false 
  })
  @IsOptional()
  @IsString()
  keywords?: string;

  @ApiProperty({ 
    description: 'Creator of the PDF document', 
    required: false 
  })
  @IsOptional()
  @IsString()
  creator?: string;

  @ApiProperty({ 
    description: 'Whether to include creation date in the metadata', 
    required: false,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  includeCreationDate?: boolean;
}

export class PptxPdfAdvancedDto {
  @ApiProperty({ 
    description: 'Whether to optimize the PDF for web viewing', 
    required: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  optimizeForWeb?: boolean;

  @ApiProperty({ 
    description: 'Whether to compress the PDF', 
    required: false,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  compressPdf?: boolean;

  @ApiProperty({ 
    description: 'Whether to preserve hyperlinks', 
    required: false,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  preserveHyperlinks?: boolean;

  @ApiProperty({ 
    description: 'Whether to create PDF bookmarks from slide titles', 
    required: false,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  createBookmarks?: boolean;

  @ApiProperty({ 
    description: 'Quality level for images (0-100)', 
    required: false,
    default: 90,
    minimum: 1,
    maximum: 100
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  imageQuality?: number;

  @ApiProperty({ 
    description: 'DPI for image downsampling (if applied)', 
    required: false,
    default: 300,
    minimum: 72,
    maximum: 1200
  })
  @IsOptional()
  @IsNumber()
  @Min(72)
  @Max(1200)
  downsampleDpi?: number;
}

export class ConvertPptxToPdfDto {
  @ApiProperty({ 
    enum: PptxPdfQuality, 
    description: 'Quality level for PDF conversion',
    default: PptxPdfQuality.STANDARD,
    required: false
  })
  @IsOptional()
  @IsEnum(PptxPdfQuality)
  quality?: PptxPdfQuality;

  @ApiProperty({ 
    enum: PptxPdfCompliance, 
    description: 'PDF version/compliance standard',
    default: PptxPdfCompliance.PDF_1_7,
    required: false
  })
  @IsOptional()
  @IsEnum(PptxPdfCompliance)
  compliance?: PptxPdfCompliance;

  @ApiProperty({ 
    enum: PptxImageHandling, 
    description: 'How to handle images during conversion',
    default: PptxImageHandling.PRESERVE,
    required: false
  })
  @IsOptional()
  @IsEnum(PptxImageHandling)
  imageHandling?: PptxImageHandling;

  @ApiProperty({ 
    description: 'Slide-specific options', 
    type: PptxPdfSlideOptionsDto,
    required: false
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PptxPdfSlideOptionsDto)
  slideOptions?: PptxPdfSlideOptionsDto;

  @ApiProperty({ 
    description: 'PDF security options', 
    type: PptxPdfSecurityDto,
    required: false
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PptxPdfSecurityDto)
  security?: PptxPdfSecurityDto;

  @ApiProperty({ 
    description: 'PDF metadata', 
    type: PptxPdfMetadataDto,
    required: false
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PptxPdfMetadataDto)
  metadata?: PptxPdfMetadataDto;

  @ApiProperty({ 
    description: 'Advanced conversion options', 
    type: PptxPdfAdvancedDto,
    required: false
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PptxPdfAdvancedDto)
  advanced?: PptxPdfAdvancedDto;

  @ApiProperty({ 
    description: 'Array of slide numbers to include (1-based, empty means all slides)', 
    required: false,
    type: [Number],
    isArray: true 
  })
  @IsOptional()
  @IsNumber({}, { each: true })
  slideSelection?: number[];
}
