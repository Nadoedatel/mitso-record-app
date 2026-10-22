import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { paginationSchema, queryId } from '../../common/dto';

/** Groups list: pagination, subject filter and search by name */
export const queryGroupSchema = paginationSchema.extend({
  subjectId: queryId.optional().meta({ description: 'Filter by subject ID' }),
  search: z.string().optional().meta({ description: 'Search by group name' }),
});

export class QueryGroupDto extends createZodDto(queryGroupSchema) {}
