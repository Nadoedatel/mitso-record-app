import { createZodDto } from 'nestjs-zod';
import { AuditAction } from '@prisma/client';
import { z } from 'zod';
import { dateOrDateTime, paginationSchema, queryId } from '../../common/dto';

/**
 * Audit log list: filters, a time range and a cursor.
 * The log only grows, so it is read by cursor ("the page after this row") and not by page number: OFFSET
 * would read and throw away every row before the page, slower the deeper the page.
 */
export const queryAuditSchema = paginationSchema.pick({ limit: true }).extend({
  cursor: z.string().max(200).optional().meta({ description: '`nextCursor` of the previous page; leave out for the first page' }),
  studentId: queryId.optional().meta({ description: 'Only changes of this student’s grades' }),
  subjectId: queryId.optional().meta({ description: 'Only changes in this subject' }),
  actorId: queryId.optional().meta({ description: 'Only changes made by this user' }),
  action: z.enum(AuditAction).optional().meta({ description: 'Only this kind of change' }),
  from: dateOrDateTime.optional().meta({ description: 'Not earlier than (date or timestamp)' }),
  to: dateOrDateTime.optional().meta({ description: 'Not later than (a plain date includes that whole day)' }),
});

export class QueryAuditDto extends createZodDto(queryAuditSchema) {}
