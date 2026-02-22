import { IsString, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGroupDto {
  @ApiProperty({ example: 'ИТ-21', description: 'Group name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 2, description: 'Course number' })
  @IsInt()
  @Min(1)
  @Max(6)
  course: number;

  @ApiProperty({ example: 'Информационные технологии', description: 'Faculty name' })
  @IsString()
  faculty: string;
}
