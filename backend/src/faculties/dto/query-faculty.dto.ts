import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const queryFacultySchema = z.strictObject({
  search: z.string().optional().meta({ description: 'Search by faculty name' }),
  page: z.coerce.number().int().min(1).optional().meta({ description: 'Page number', example: 1 }),
  limit: z.coerce.number().int().min(1).optional().meta({ description: 'Items per page', example: 20 }),
});

export class QueryFacultyDto extends createZodDto(queryFacultySchema) {}
export type QueryFacultyInput = z.infer<typeof queryFacultySchema>;
