import { Role } from '@prisma/client';

export interface JwtPayload {
  sub: number; // user id
  email: string;
  role: Role;
  /** Family id of the login that issued the token; lets logout revoke it. Absent on tokens issued before it existed */
  sid?: string;
}
