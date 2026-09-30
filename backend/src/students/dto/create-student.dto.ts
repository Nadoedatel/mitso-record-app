import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { dateOrDateTime, idSchema } from '../../common/dto';

export const createStudentSchema = z.strictObject({
  email: z.email().meta({ example: 'student@mitso.by' }),
  password: z.string().min(6).max(128),
  firstName: z.string(),
  lastName: z.string(),
  middleName: z.string().nullish(),
  studentId: z.string().meta({ description: 'Номер зачетной книжки' }),
  groupId: idSchema.nullish(),
  course: z.number().int().min(1).max(6),
  specializationId: idSchema.nullish(),
  enrollmentYear: z.number().int().min(2000).max(2100),
  phone: z.string().nullish(),
  address: z.string().nullish(),
  birthDate: dateOrDateTime.nullish(),
});

export class CreateStudentDto extends createZodDto(createStudentSchema) {}
