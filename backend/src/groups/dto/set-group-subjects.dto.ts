import { IsArray, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetGroupSubjectsDto {
  @ApiProperty({ type: [Number], description: 'Subject IDs to assign to the group' })
  @IsArray()
  @IsInt({ each: true })
  subjectIds: number[];
}
