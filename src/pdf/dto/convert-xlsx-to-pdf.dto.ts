import { IsBoolean, IsEnum, IsNumber, IsObject, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PdfQuality, PdfCompliance, PdfSecurity, PdfMetadata, AdvancedOptions } from './convert-to-pdf.dto';

/**
 * Excel print options
 */
export enum XlsxPrintOptions {
  FIT_TO_PAGE = 'fit_to_page',
  ACTUAL_SIZE = 'actual_size',
  SCALE = 'scale',
}

/**
 * Paper size options
 */
export enum XlsxPaperSize {
  A4 = 'a4',
  LETTER = 'letter',
  LEGAL = 'legal',
  A3 = 'a3',
  TABLOID = 'tabloid',
}

/**
 * Sheet selection options
 */
export enum XlsxSheetSelection {
  ALL = 'all',
  SPECIFIC = 'specific',
  RANGE = 'range',
}

/**
 * Excel-specific advanced options
 */
export class XlsxAdvancedOptions {
  @IsBoolean()
  @IsOptional()
  printTitle?: boolean = true;

  @IsBoolean()
  @IsOptional()
  printGridlines?: boolean = true;

  @IsBoolean()
  @IsOptional()
  printHeadings?: boolean = true;

  @IsBoolean()
  @IsOptional()
  printComments?: boolean = false;

  @IsString()
  @IsOptional()
  printQuality?: 'draft' | 'normal' | 'high' = 'normal';

  @IsBoolean()
  @IsOptional()
  centerHorizontally?: boolean = true;

  @IsBoolean()
  @IsOptional()
  centerVertically?: boolean = false;
}

/**
 * Options for converting XLSX to PDF
 */
export class ConvertXlsxToPdfDto {
  @IsEnum(PdfQuality)
  @IsOptional()
  quality?: PdfQuality = PdfQuality.STANDARD;

  @IsEnum(PdfCompliance)
  @IsOptional()
  compliance?: PdfCompliance = PdfCompliance.PDF_1_7;

  @IsEnum(XlsxPrintOptions)
  @IsOptional()
  printOption?: XlsxPrintOptions = XlsxPrintOptions.FIT_TO_PAGE;

  @IsEnum(XlsxPaperSize)
  @IsOptional()
  paperSize?: XlsxPaperSize = XlsxPaperSize.A4;

  @IsBoolean()
  @IsOptional()
  landscape?: boolean = false;

  @IsEnum(XlsxSheetSelection)
  @IsOptional()
  sheetSelection?: XlsxSheetSelection = XlsxSheetSelection.ALL;

  @IsArray()
  @IsOptional()
  specificSheets?: string[] | number[] = [];

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

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => XlsxAdvancedOptions)
  xlsxAdvanced?: XlsxAdvancedOptions;
}
