import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { createGradeSchema } from './create-grade.dto';

export const batchCreateGradeSchema = z.strictObject({
  grades: z.array(createGradeSchema).min(1).meta({ description: 'Grades to create or update' }),
});

export class BatchCreateGradeDto extends createZodDto(batchCreateGradeSchema) {}
