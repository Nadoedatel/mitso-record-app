import { IsArray, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateGradeDto } from './create-grade.dto';

export class BatchCreateGradeDto {
  @ApiProperty({
    type: [CreateGradeDto],
    description: 'Array of grades to create or update',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateGradeDto)
  grades: CreateGradeDto[];
}
