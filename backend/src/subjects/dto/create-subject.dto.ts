import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createSubjectSchema = z.strictObject({
  name: z.string().meta({ example: 'Математический анализ', description: 'Subject name' }),
  code: z.string().meta({ example: 'MATH101', description: 'Subject code' }),
  credits: z.number().int().min(1).max(10).meta({ example: 4, description: 'Number of credits' }),
  semester: z.number().int().min(1).max(12).meta({ example: 1, description: 'Semester number' }),
  description: z.string().nullish().meta({ description: 'Subject description' }),
});

export class CreateSubjectDto extends createZodDto(createSubjectSchema) {}
