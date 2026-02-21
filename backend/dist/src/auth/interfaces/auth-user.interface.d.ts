import { Role } from '@prisma/client';
export interface AuthUser {
    id: number;
    email: string;
    role: Role;
}
