import { IsString, IsInt, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGroupDto {
  @ApiProperty({ example: 'ИТ-21', description: 'Group name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 2, description: 'Course number' })
  @IsInt()
  @Min(1)
  @Max(6)
  course: number;

  @ApiPropertyOptional({ example: 1, description: 'Faculty ID' })
  @IsInt()
  @IsOptional()
  facultyId?: number;
}
