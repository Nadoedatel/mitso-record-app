import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { idSchema } from '../../common/dto';

/** Replaces the whole set, so an empty list (remove all subjects) is valid */
export const setTeacherSubjectsSchema = z.strictObject({
  subjectIds: z.array(idSchema).meta({ description: 'Array of subject IDs', example: [1, 2, 3] }),
});

export class SetTeacherSubjectsDto extends createZodDto(setTeacherSubjectsSchema) {}
