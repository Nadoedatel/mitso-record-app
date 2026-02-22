import { IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto';

/**
 * DTO for querying grades with pagination and filters
 */
export class QueryGradeDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  studentId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  subjectId?: number;
}
