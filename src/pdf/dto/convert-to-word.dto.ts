import { IsBoolean, IsEnum, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Conversion quality options
 * - BASIC: Fast conversion with basic formatting
 * - STANDARD: Good balance between speed and formatting quality
 * - ENHANCED: Better text layout preservation but slower
 * - PRECISE: Best formatting fidelity but slowest performance
 */
export enum ConversionQuality {
  BASIC = 'basic',
  STANDARD = 'standard',
  ENHANCED = 'enhanced',
  PRECISE = 'precise',
}

/**
 * Font handling strategy options
 * - SUBSTITUTE: Use system fonts when original font is not available
 * - EMBED: Embed fonts in the document when possible
 * - FALLBACK_ONLY: Only substitute when absolutely necessary
 */
export enum FontHandling {
  SUBSTITUTE = 'substitute',
  EMBED = 'embed',
  FALLBACK_ONLY = 'fallback_only',
}

/**
 * Document formatting options
 */
export class DocumentFormatting {
  @IsBoolean()
  @IsOptional()
  preserveImages?: boolean = true;

  @IsBoolean()
  @IsOptional()
  preserveLinks?: boolean = true;

  @IsBoolean()
  @IsOptional()
  preserveTables?: boolean = true;

  @IsBoolean()
  @IsOptional()
  preserveFormattingMarks?: boolean = true;

  @IsString()
  @IsOptional()
  defaultFontFamily?: string;
}

/**
 * Advanced conversion options for PDF to Word conversion
 */
export class AdvancedConversionOptions {
  @IsBoolean()
  @IsOptional()
  detectLists?: boolean = true;

  @IsBoolean()
  @IsOptional()
  detectHeadings?: boolean = true;

  @IsBoolean()
  @IsOptional()
  detectTables?: boolean = true;

  @IsBoolean()
  @IsOptional()
  preserveColorProfile?: boolean = true;

  @IsBoolean()
  @IsOptional()
  optimizeForAccessibility?: boolean = false;

  @IsBoolean()
  @IsOptional()
  includeDocumentProperties?: boolean = true;
}

/**
 * Options for converting PDF to Word
 */
export class ConvertToWordDto {
  @IsEnum(ConversionQuality)
  @IsOptional()
  quality?: ConversionQuality = ConversionQuality.STANDARD;

  @IsEnum(FontHandling)
  @IsOptional()
  fontHandling?: FontHandling = FontHandling.SUBSTITUTE;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => DocumentFormatting)
  formatting?: DocumentFormatting;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => AdvancedConversionOptions)
  advanced?: AdvancedConversionOptions;
}
