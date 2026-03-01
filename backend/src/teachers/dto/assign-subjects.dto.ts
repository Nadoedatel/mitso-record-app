import { IsArray, IsInt, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignSubjectsDto {
  @ApiProperty({ example: [1, 2, 3], description: 'Array of subject IDs to assign' })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  subjectIds: number[];
}
