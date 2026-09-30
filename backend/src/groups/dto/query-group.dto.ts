import { createZodDto } from 'nestjs-zod';
import { paginationSchema, queryId } from '../../common/dto';

/** Groups list: pagination and subject filter */
export const queryGroupSchema = paginationSchema.extend({
  subjectId: queryId.optional().meta({ description: 'Filter by subject ID' }),
});

export class QueryGroupDto extends createZodDto(queryGroupSchema) {}
