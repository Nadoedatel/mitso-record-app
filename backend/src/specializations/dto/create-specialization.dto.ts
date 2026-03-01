import { IsString, IsInt, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSpecializationDto {
  @ApiProperty({ description: 'Specialization name', example: 'Программная инженерия' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Specialization code', example: '1-40 01 02' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ description: 'Faculty ID', example: 1 })
  @IsInt()
  facultyId: number;
}
