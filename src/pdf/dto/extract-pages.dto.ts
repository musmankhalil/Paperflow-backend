import { IsArray, IsNumber, Min, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ExtractPagesDto {
  @ApiProperty({
    description: 'Page numbers to extract from the PDF',
    example: [1, 3, 5],
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one page number is required' })
  @IsNumber({}, { each: true })
  @Min(1, { each: true })
  @Type(() => Number)
  pages: number[];
}