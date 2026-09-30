import { createZodDto } from 'nestjs-zod';
import { createGroupSchema } from './create-group.dto';

export const updateGroupSchema = createGroupSchema.partial();

export class UpdateGroupDto extends createZodDto(updateGroupSchema) {}
