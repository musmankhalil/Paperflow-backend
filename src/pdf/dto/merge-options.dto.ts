import { IsOptional, IsString, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class DocumentInfoDto {
  @ApiProperty({ 
    description: 'Title of the merged PDF document',
    example: 'Merged Document',
    required: false
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ 
    description: 'Author of the merged PDF document',
    example: 'PaperFlow API',
    required: false
  })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiProperty({ 
    description: 'Subject of the merged PDF document',
    example: 'Merged PDFs',
    required: false
  })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty({ 
    description: 'Keywords for the merged PDF document',
    example: 'merged, combined, pdf, documents',
    required: false
  })
  @IsOptional()
  @IsString()
  keywords?: string;
}

class BookmarkDto {
  @ApiProperty({ 
    description: 'Title of the bookmark',
    example: 'Document 1'
  })
  @IsString()
  title: string;

  @ApiProperty({ 
    description: 'Page number that this bookmark should point to (1-based)',
    example: 1
  })
  @IsString()
  pageNumber: number;
}

export class MergeOptionsDto {
  @ApiProperty({ 
    description: 'Information to set on the merged document',
    required: false,
    type: DocumentInfoDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DocumentInfoDto)
  documentInfo?: DocumentInfoDto;

  @ApiProperty({ 
    description: 'Whether to add bookmarks for each merged document',
    example: true,
    required: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  addBookmarks?: boolean;

  @ApiProperty({ 
    description: 'Custom bookmarks to add to the document',
    type: [BookmarkDto],
    required: false
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BookmarkDto)
  bookmarks?: BookmarkDto[];

  @ApiProperty({
    description: 'Array of file indices indicating the order in which to merge the files (0-based)',
    example: [0, 2, 1],
    required: false
  })
  @IsOptional()
  @IsArray()
  fileOrder?: number[];
}