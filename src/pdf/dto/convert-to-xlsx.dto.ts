import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsBoolean, IsObject, IsNumber, IsString, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export enum TableExtractionMode {
  AUTO = 'auto',
  HEURISTIC = 'heuristic',
  PRECISE = 'precise', 
  STRUCTURED = 'structured',
}

export enum DataRecognitionLevel {
  BASIC = 'basic',
  STANDARD = 'standard',
  ENHANCED = 'enhanced',
}

export enum SpreadsheetFormat {
  XLSX = 'xlsx',
  CSV = 'csv',
  ODS = 'ods',
}

export class TableDetectionOptionsDto {
  @ApiProperty({ 
    description: 'Minimum confidence threshold for table detection (0-100)',
    required: false,
    type: Number,
    minimum: 0,
    maximum: 100,
    default: 75
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minConfidence?: number;

  @ApiProperty({ 
    description: 'Whether to include tables that span multiple pages',
    required: false,
    type: Boolean,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  detectMultiPageTables?: boolean;

  @ApiProperty({ 
    description: 'Whether to merge adjacent tables with similar structure',
    required: false, 
    type: Boolean,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  mergeAdjacentTables?: boolean;
}

export class FormatOptionsDto {
  @ApiProperty({ 
    description: 'Whether to include original page numbers as worksheet names',
    required: false,
    type: Boolean,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  pageNumbersAsWorksheetNames?: boolean;

  @ApiProperty({ 
    description: 'Whether to include table captions in the output',
    required: false,
    type: Boolean,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  includeTableCaptions?: boolean;

  @ApiProperty({ 
    description: 'Whether to auto-detect and apply data types (numbers, dates, etc.)',
    required: false,
    type: Boolean,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  autoDetectDataTypes?: boolean;

  @ApiProperty({ 
    description: 'Whether to create a summary sheet with metadata',
    required: false,
    type: Boolean,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  createSummarySheet?: boolean;
}

export class DataCleanupOptionsDto {
  @ApiProperty({ 
    description: 'Whether to remove empty rows',
    required: false,
    type: Boolean,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  removeEmptyRows?: boolean;

  @ApiProperty({ 
    description: 'Whether to remove duplicate header rows',
    required: false,
    type: Boolean,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  removeDuplicateHeaders?: boolean;

  @ApiProperty({ 
    description: 'Whether to normalize whitespace in text cells',
    required: false,
    type: Boolean,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  normalizeWhitespace?: boolean;

  @ApiProperty({ 
    description: 'Whether to trim text in cells',
    required: false,
    type: Boolean,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  trimTextCells?: boolean;
}

export class AdvancedOptionsDto {
  @ApiProperty({ 
    description: 'Whether to attempt to reconstruct formulas from calculated values',
    required: false,
    type: Boolean,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  reconstructFormulas?: boolean;

  @ApiProperty({ 
    description: 'Whether to recognize and convert charts to Excel charts',
    required: false,
    type: Boolean,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  convertCharts?: boolean;

  @ApiProperty({ 
    description: 'Custom column headers to use (overrides detected headers)',
    required: false,
    type: [String]
  })
  @IsOptional()
  @IsString({ each: true })
  customHeaders?: string[];

  @ApiProperty({ 
    description: 'Whether to add basic formatting to tables (alternating row colors, header styles)',
    required: false,
    type: Boolean,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  addBasicFormatting?: boolean;

  @ApiProperty({ 
    description: 'Whether to auto-fit column widths based on content',
    required: false,
    type: Boolean,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  autoFitColumns?: boolean;
}

export class PageSelectionDto {
  @ApiProperty({ 
    description: 'Page ranges to process (e.g., "1-5,8,11-13")',
    required: false,
    type: String
  })
  @IsOptional()
  @IsString()
  ranges?: string;

  @ApiProperty({ 
    description: 'Specific pages to include',
    required: false,
    type: [Number]
  })
  @IsOptional()
  @IsNumber({}, { each: true })
  include?: number[];

  @ApiProperty({ 
    description: 'Pages to exclude from processing',
    required: false,
    type: [Number]
  })
  @IsOptional()
  @IsNumber({}, { each: true })
  exclude?: number[];
}

export class ConvertToXlsxDto {
  @ApiProperty({ 
    description: 'Table extraction strategy',
    enum: TableExtractionMode,
    default: TableExtractionMode.AUTO,
    required: false
  })
  @IsOptional()
  @IsEnum(TableExtractionMode)
  extractionMode?: TableExtractionMode;

  @ApiProperty({ 
    description: 'Level of data recognition quality',
    enum: DataRecognitionLevel,
    default: DataRecognitionLevel.STANDARD,
    required: false
  })
  @IsOptional()
  @IsEnum(DataRecognitionLevel)
  recognitionLevel?: DataRecognitionLevel;

  @ApiProperty({ 
    description: 'Output format for the spreadsheet',
    enum: SpreadsheetFormat,
    default: SpreadsheetFormat.XLSX,
    required: false
  })
  @IsOptional()
  @IsEnum(SpreadsheetFormat)
  outputFormat?: SpreadsheetFormat;

  @ApiProperty({ 
    description: 'Table detection options',
    type: TableDetectionOptionsDto,
    required: false
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => TableDetectionOptionsDto)
  tableDetection?: TableDetectionOptionsDto;

  @ApiProperty({ 
    description: 'Formatting options',
    type: FormatOptionsDto,
    required: false
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => FormatOptionsDto)
  formatting?: FormatOptionsDto;

  @ApiProperty({ 
    description: 'Data cleanup options',
    type: DataCleanupOptionsDto, 
    required: false
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => DataCleanupOptionsDto)
  dataCleanup?: DataCleanupOptionsDto;

  @ApiProperty({ 
    description: 'Advanced options',
    type: AdvancedOptionsDto,
    required: false
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AdvancedOptionsDto)
  advanced?: AdvancedOptionsDto;

  @ApiProperty({ 
    description: 'Page selection options',
    type: PageSelectionDto,
    required: false
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PageSelectionDto)
  pageSelection?: PageSelectionDto;
}
