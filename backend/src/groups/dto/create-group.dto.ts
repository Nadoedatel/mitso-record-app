import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { idSchema } from '../../common/dto';

export const createGroupSchema = z.strictObject({
  name: z.string().meta({ example: 'ИТ-21', description: 'Group name' }),
  course: z.number().int().min(1).max(6).meta({ example: 2, description: 'Course number' }),
  facultyId: idSchema.nullish().meta({ example: 1, description: 'Faculty ID' }),
});

export class CreateGroupDto extends createZodDto(createGroupSchema) {}
