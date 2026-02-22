import { IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto';

/**
 * DTO for querying subjects with pagination and filters
 */
export class QuerySubjectDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by teacher ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  teacherId?: number;

  @ApiPropertyOptional({ description: 'Filter by semester' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  semester?: number;
}
