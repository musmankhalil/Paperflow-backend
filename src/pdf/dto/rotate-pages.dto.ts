import { IsArray, IsNumber, Min, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class RotationDto {
  @ApiProperty({
    description: 'Page number to rotate (starting from 1)',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @Min(1, { message: 'Page number must be at least 1' })
  page: number;

  @ApiProperty({
    description: 'Rotation angle in degrees (90, 180, 270)',
    example: 90,
  })
  @IsNumber()
  degrees: number;
}

export class RotatePagesDto {
  @ApiProperty({
    description: 'List of page rotations to apply',
    type: [RotationDto],
    example: [
      { page: 1, degrees: 90 },
      { page: 2, degrees: 180 },
    ],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one rotation instruction is required' })
  @ValidateNested({ each: true })
  @Type(() => RotationDto)
  rotations: RotationDto[];
}