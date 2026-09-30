import { createZodDto } from 'nestjs-zod';
import { createStudentSchema } from './create-student.dto';

// Credentials are not editable via student profile update
export const updateStudentSchema = createStudentSchema.omit({ email: true, password: true }).partial();

export class UpdateStudentDto extends createZodDto(updateStudentSchema) {}
