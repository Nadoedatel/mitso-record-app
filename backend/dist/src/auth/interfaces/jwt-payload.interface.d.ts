import { Role } from '@prisma/client';
export interface JwtPayload {
    sub: number;
    email: string;
    role: Role;
}
