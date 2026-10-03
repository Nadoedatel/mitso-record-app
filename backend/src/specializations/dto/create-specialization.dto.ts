import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { idSchema } from '../../common/dto';

export const createSpecializationSchema = z.strictObject({
  name: z.string().meta({ description: 'Specialization name', example: 'Программная инженерия' }),
  code: z.string().nullish().meta({ description: 'Specialization code', example: '1-40 01 02' }),
  facultyId: idSchema.meta({ description: 'Faculty ID', example: 1 }),
});

export class CreateSpecializationDto extends createZodDto(createSpecializationSchema) {}
