import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { idListSchema } from '../../common/dto';

export const assignGroupsSchema = z.strictObject({
  groupIds: idListSchema.meta({ description: 'Array of group IDs to assign', example: [1, 2, 3] }),
});

export class AssignGroupsDto extends createZodDto(assignGroupsSchema) {}
