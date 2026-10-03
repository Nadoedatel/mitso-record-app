import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { paginationSchema, queryId } from '../../common/dto';

/** Students list: pagination, search by name and group filter */
export const queryStudentSchema = paginationSchema.extend({
  search: z.string().optional().meta({ description: 'Search by name (first, last, or middle name)' }),
  groupId: queryId.optional().meta({ description: 'Filter by group ID' }),
});

export class QueryStudentDto extends createZodDto(queryStudentSchema) {}
