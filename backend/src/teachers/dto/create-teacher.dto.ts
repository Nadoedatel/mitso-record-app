import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createTeacherSchema = z.strictObject({
  email: z.email().meta({ example: 'teacher@mitso.by' }),
  password: z.string().min(6).max(128),
  firstName: z.string(),
  lastName: z.string(),
  middleName: z.string().nullish(),
  department: z.string(),
  position: z.string(),
  academicDegree: z.string().nullish(),
  phone: z.string().nullish(),
  officeNumber: z.string().nullish(),
});

export class CreateTeacherDto extends createZodDto(createTeacherSchema) {}
