import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { paginationSchema, queryId } from '../../common/dto';

/** Subjects list: pagination and filters */
export const querySubjectSchema = paginationSchema.extend({
  teacherId: queryId.optional().meta({ description: 'Filter by teacher ID' }),
  semester: z.coerce.number().int().optional().meta({ description: 'Filter by semester' }),
});

export class QuerySubjectDto extends createZodDto(querySubjectSchema) {}
