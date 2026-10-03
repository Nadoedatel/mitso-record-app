import { z } from 'zod';

/**
 * Zod counterpart of PaginationDto: page and limit from the query string.
 * Extend it with `.extend({...})` for list endpoints that have filters.
 */
export const paginationSchema = z.strictObject({
  page: z.coerce.number().int().min(1).optional().meta({ description: 'Page number', example: 1 }),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(500)
    .optional()
    .meta({ description: 'Items per page (max 500)', example: 20 }),
});
