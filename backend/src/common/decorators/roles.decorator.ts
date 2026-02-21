import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * @Roles() decorator - sets required roles for endpoint
 * Usage: @Roles(Role.ADMIN, Role.TEACHER)
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
