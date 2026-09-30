import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { createFacultySchema } from './create-faculty.dto';

export const updateFacultySchema = createFacultySchema.partial();

export class UpdateFacultyDto extends createZodDto(updateFacultySchema) {}
export type UpdateFacultyInput = z.infer<typeof updateFacultySchema>;
