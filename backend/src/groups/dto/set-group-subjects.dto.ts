import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { idSchema } from '../../common/dto';

/** Replaces the whole set, so an empty list is valid */
export const setGroupSubjectsSchema = z.strictObject({
  subjectIds: z.array(idSchema).meta({ description: 'Subject IDs to assign to the group' }),
});

export class SetGroupSubjectsDto extends createZodDto(setGroupSubjectsSchema) {}
