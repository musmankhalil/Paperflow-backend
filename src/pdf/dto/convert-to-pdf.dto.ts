import { IsBoolean, IsEnum, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * PDF output quality options
 * - DRAFT: Lowest quality, smallest file size
 * - STANDARD: Standard quality, good balance between quality and file size
 * - HIGH: High quality, larger file size
 * - PREPRESS: Highest quality for professional printing, largest file size
 */
export enum PdfQuality {
  DRAFT = 'draft',
  STANDARD = 'standard',
  HIGH = 'high',
  PREPRESS = 'prepress',
}

/**
 * PDF compliance standards
 * - PDF_1_7: Standard PDF 1.7 format (ISO 32000-1)
 * - PDF_A_1B: PDF/A-1b format for long-term archiving
 * - PDF_A_2B: PDF/A-2b format with better compression
 * - PDF_A_3B: PDF/A-3b format with embedded files support
 */
export enum PdfCompliance {
  PDF_1_7 = 'pdf1.7',
  PDF_A_1B = 'pdfa1b',
  PDF_A_2B = 'pdfa2b',
  PDF_A_3B = 'pdfa3b',
}

/**
 * Font embedding options
 * - SUBSET: Embed only the used characters (smaller file size)
 * - FULL: Embed entire fonts used in the document
 * - NONE: Don't embed fonts (not recommended for sharing)
 */
export enum FontEmbedding {
  SUBSET = 'subset',
  FULL = 'full',
  NONE = 'none',
}

/**
 * PDF Security options
 */
export class PdfSecurity {
  @IsBoolean()
  @IsOptional()
  encrypt?: boolean = false;

  @IsString()
  @IsOptional()
  userPassword?: string;

  @IsString()
  @IsOptional()
  ownerPassword?: string;

  @IsBoolean()
  @IsOptional()
  disallowPrinting?: boolean = false;

  @IsBoolean()
  @IsOptional()
  disallowModifying?: boolean = false;

  @IsBoolean()
  @IsOptional()
  disallowCopying?: boolean = false;

  @IsBoolean()
  @IsOptional()
  disallowAnnotating?: boolean = false;
}

/**
 * PDF metadata options
 */
export class PdfMetadata {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  author?: string;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsOptional()
  keywords?: string;

  @IsString()
  @IsOptional()
  creator?: string;

  @IsBoolean()
  @IsOptional()
  includeCreationDate?: boolean = true;
}

/**
 * Advanced compression and optimization options
 */
export class AdvancedOptions {
  @IsNumber()
  @IsOptional()
  imageQuality?: number = 90;

  @IsBoolean()
  @IsOptional()
  compressImages?: boolean = true;

  @IsNumber()
  @IsOptional()
  downsampleDpi?: number = 300;

  @IsBoolean()
  @IsOptional()
  optimizeForWeb?: boolean = false;

  @IsBoolean()
  @IsOptional()
  grayscale?: boolean = false;
  
  @IsBoolean()
  @IsOptional()
  preserveBookmarks?: boolean = true;

  @IsBoolean()
  @IsOptional()
  preserveHyperlinks?: boolean = true;

  @IsBoolean()
  @IsOptional()
  preserveFormFields?: boolean = true;
}

/**
 * Options for converting DOCX to PDF
 */
export class ConvertToPdfDto {
  @IsEnum(PdfQuality)
  @IsOptional()
  quality?: PdfQuality = PdfQuality.STANDARD;

  @IsEnum(PdfCompliance)
  @IsOptional()
  compliance?: PdfCompliance = PdfCompliance.PDF_1_7;

  @IsEnum(FontEmbedding)
  @IsOptional()
  fontEmbedding?: FontEmbedding = FontEmbedding.SUBSET;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => PdfSecurity)
  security?: PdfSecurity;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => PdfMetadata)
  metadata?: PdfMetadata;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => AdvancedOptions)
  advanced?: AdvancedOptions;
}
