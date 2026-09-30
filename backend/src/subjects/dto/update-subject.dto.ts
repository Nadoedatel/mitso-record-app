import { createZodDto } from 'nestjs-zod';
import { createSubjectSchema } from './create-subject.dto';

export const updateSubjectSchema = createSubjectSchema.partial();

export class UpdateSubjectDto extends createZodDto(updateSubjectSchema) {}
