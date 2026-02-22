import { IsOptional, IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto';

/**
 * DTO for querying students with pagination and search
 */
export class QueryStudentDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by name (first, last, or middle name)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by group ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  groupId?: number;
}
