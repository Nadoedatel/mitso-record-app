import { IsArray, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetSubjectTeachersDto {
  @ApiProperty({ description: 'Array of teacher IDs', example: [1, 2, 3] })
  @IsArray()
  @IsInt({ each: true })
  teacherIds: number[];
}
