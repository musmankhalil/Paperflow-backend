import { IsOptional, IsString, IsEnum, IsInt, IsBoolean, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export enum EncryptionLevel {
  LOW = 'low',       // 40-bit RC4 (PDF 1.1-1.3)
  MEDIUM = 'medium', // 128-bit RC4 (PDF 1.4-1.6)
  HIGH = 'high'      // 256-bit AES (PDF 1.7+)
}

export enum UserPermissions {
  PRINT = 'print',
  MODIFY = 'modify',
  COPY = 'copy',
  ANNOTATE = 'annotate',
  FILL_FORMS = 'fillForms',
  EXTRACT = 'extract',
  ASSEMBLE = 'assemble',
  PRINT_HIGH_QUALITY = 'printHighQuality'
}

export class ProtectOptionsDto {
  @IsString()
  userPassword: string;

  @IsOptional()
  @IsString()
  ownerPassword?: string;

  @IsOptional()
  @IsEnum(EncryptionLevel)
  encryptionLevel?: EncryptionLevel = EncryptionLevel.HIGH;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return Boolean(value);
  })
  allowPrinting?: boolean = false;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return Boolean(value);
  })
  allowModifying?: boolean = false;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return Boolean(value);
  })
  allowCopying?: boolean = false;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return Boolean(value);
  })
  allowAnnotating?: boolean = false;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return Boolean(value);
  })
  allowFillingForms?: boolean = false;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return Boolean(value);
  })
  allowScreenReaders?: boolean = false;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return Boolean(value);
  })
  allowAssembly?: boolean = false;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return Boolean(value);
  })
  allowDegradedPrinting?: boolean = false;
}
