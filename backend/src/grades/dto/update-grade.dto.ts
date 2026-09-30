import { createZodDto } from 'nestjs-zod';
import { createGradeSchema } from './create-grade.dto';

export const updateGradeSchema = createGradeSchema.partial();

export class UpdateGradeDto extends createZodDto(updateGradeSchema) {}
