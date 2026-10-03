import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { paginationSchema } from '../../common/dto';

/** Teachers list: pagination and search */
export const queryTeacherSchema = paginationSchema.extend({
  search: z.string().optional().meta({ description: 'Search by name' }),
});

export class QueryTeacherDto extends createZodDto(queryTeacherSchema) {}
