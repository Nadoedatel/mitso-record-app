import { Role } from '@prisma/client';

/**
 * AuthUser - user object attached to request after JWT validation
 */
export interface AuthUser {
  id: number;
  email: string;
  role: Role;
}
