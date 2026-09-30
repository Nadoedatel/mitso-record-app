import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const loginSchema = z.strictObject({
  email: z.email().meta({ example: 'student@mitso.by' }),
  password: z.string().min(1).max(128),
});

export class LoginDto extends createZodDto(loginSchema) {}
