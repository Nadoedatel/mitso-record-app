import { IsArray, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetTeacherSubjectsDto {
  @ApiProperty({ description: 'Array of subject IDs', example: [1, 2, 3] })
  @IsArray()
  @IsInt({ each: true })
  subjectIds: number[];
}
