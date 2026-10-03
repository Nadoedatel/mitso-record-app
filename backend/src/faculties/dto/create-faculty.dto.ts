import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createFacultySchema = z
  .strictObject({
    name: z.string().trim().min(1).meta({
      description: 'Faculty name',
      example: 'Факультет информационных технологий',
    }),
  });

export class CreateFacultyDto extends createZodDto(createFacultySchema) {}
export type CreateFacultyInput = z.infer<typeof createFacultySchema>;
