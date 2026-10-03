import { createZodDto } from 'nestjs-zod';
import { createTeacherSchema } from './create-teacher.dto';

export const updateTeacherSchema = createTeacherSchema.partial();

export class UpdateTeacherDto extends createZodDto(updateTeacherSchema) {}
