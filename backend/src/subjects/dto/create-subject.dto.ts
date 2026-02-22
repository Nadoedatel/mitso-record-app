import { IsString, IsInt, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubjectDto {
  @ApiProperty({ example: 'Математический анализ', description: 'Subject name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'MATH101', description: 'Subject code' })
  @IsString()
  code: string;

  @ApiProperty({ example: 4, description: 'Number of credits' })
  @IsInt()
  @Min(1)
  @Max(10)
  credits: number;

  @ApiProperty({ example: 1, description: 'Semester number' })
  @IsInt()
  @Min(1)
  @Max(12)
  semester: number;

  @ApiPropertyOptional({ description: 'Subject description' })
  @IsString()
  @IsOptional()
  description?: string;
}
