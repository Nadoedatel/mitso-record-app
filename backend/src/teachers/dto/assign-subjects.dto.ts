import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { idListSchema } from '../../common/dto';

export const assignSubjectsSchema = z.strictObject({
  subjectIds: idListSchema.meta({ description: 'Array of subject IDs to assign', example: [1, 2, 3] }),
});

export class AssignSubjectsDto extends createZodDto(assignSubjectsSchema) {}
