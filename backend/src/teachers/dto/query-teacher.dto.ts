import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto';

/**
 * DTO for querying teachers with pagination and search
 */
export class QueryTeacherDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;
}
