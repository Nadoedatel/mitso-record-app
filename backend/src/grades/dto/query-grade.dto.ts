import { createZodDto } from 'nestjs-zod';
import { paginationSchema, queryId } from '../../common/dto';

export const queryGradeSchema = paginationSchema.extend({
  studentId: queryId.optional(),
  subjectId: queryId.optional(),
});

export class QueryGradeDto extends createZodDto(queryGradeSchema) {}
