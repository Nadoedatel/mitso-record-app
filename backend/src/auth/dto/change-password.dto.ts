import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const changePasswordSchema = z
  .strictObject({
    currentPassword: z.string().min(1).max(128),
    newPassword: z.string().min(8).max(128),
  })
  .refine((dto) => dto.currentPassword !== dto.newPassword, {
    message: 'Новый пароль должен отличаться от текущего',
    path: ['newPassword'],
  });

export class ChangePasswordDto extends createZodDto(changePasswordSchema) {}
