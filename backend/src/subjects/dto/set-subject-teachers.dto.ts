import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { idSchema } from '../../common/dto';

/** Replaces the whole set, so an empty list is valid */
export const setSubjectTeachersSchema = z.strictObject({
  teacherIds: z.array(idSchema).meta({ description: 'Array of teacher IDs', example: [1, 2, 3] }),
});

export class SetSubjectTeachersDto extends createZodDto(setSubjectTeachersSchema) {}
