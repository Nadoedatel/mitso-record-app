import { createZodDto } from 'nestjs-zod';
import { createSpecializationSchema } from './create-specialization.dto';

export const updateSpecializationSchema = createSpecializationSchema.partial();

export class UpdateSpecializationDto extends createZodDto(updateSpecializationSchema) {}
