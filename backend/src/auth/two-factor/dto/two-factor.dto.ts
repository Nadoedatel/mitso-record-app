import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const totpCode = z.string().regex(/^\d{6}$/, 'Код состоит из 6 цифр');

/** Second step of the login */
export const verifyTwoFactorSchema = z.strictObject({
  challengeToken: z.string().min(1).max(2048),
  code: z.string().trim().min(1).max(32).meta({ description: '6-digit code from the app, or a recovery code' }),
});
export class VerifyTwoFactorDto extends createZodDto(verifyTwoFactorSchema) {}

/** Finishing the setup: the first code proves that the app has the secret */
export const enableTwoFactorSchema = z.strictObject({ code: totpCode });
export class EnableTwoFactorDto extends createZodDto(enableTwoFactorSchema) {}

/** Turning it off asks for both the password and a code: a stolen access token is not enough */
export const disableTwoFactorSchema = z.strictObject({
  password: z.string().min(1).max(128),
  code: z.string().trim().min(1).max(32).meta({ description: '6-digit code from the app, or a recovery code' }),
});
export class DisableTwoFactorDto extends createZodDto(disableTwoFactorSchema) {}
