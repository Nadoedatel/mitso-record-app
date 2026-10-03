import { createZodDto } from 'nestjs-zod';
import { GradeType } from '@prisma/client';
import { z } from 'zod';
import { dateOrDateTime, idSchema } from '../../common/dto';

/**
 * Structural rules only (types, 0-10 range). The per-type rule ("CREDIT accepts only 0 or 1")
 * lives in grade-rules.ts and runs in the service, so a batch can report a bad row
 * without rejecting the whole request.
 */
export const createGradeSchema = z.strictObject({
  studentId: idSchema,
  subjectId: idSchema,
  gradeValue: z.number().int().min(0).max(10).meta({ description: '1-10; for CREDIT 0 = not passed, 1 = passed' }),
  gradeType: z.enum(GradeType),
  examDate: dateOrDateTime.nullish(),
  notes: z.string().nullish(),
});

export class CreateGradeDto extends createZodDto(createGradeSchema) {}
