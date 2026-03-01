import { IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto';

export class QueryGroupDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by subject ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  subjectId?: number;
}
