import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto';
import { AuthUser } from './interfaces/auth-user.interface';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto, res: Response): Promise<{
        user: {
            id: number;
            email: string;
            role: import(".prisma/client").$Enums.Role;
        };
        accessToken: string;
    }>;
    login(dto: LoginDto, res: Response): Promise<{
        user: {
            id: number;
            email: string;
            role: import(".prisma/client").$Enums.Role;
        };
        accessToken: string;
    }>;
    refresh(req: Request, res: Response): Promise<{
        accessToken: string;
    }>;
    getMe(user: AuthUser): Promise<{
        id: number;
        email: string;
        role: import(".prisma/client").$Enums.Role;
        student: {
            course: number;
            faculty: string;
            createdAt: Date;
            updatedAt: Date;
            id: number;
            firstName: string;
            lastName: string;
            middleName: string | null;
            studentId: string;
            specialization: string;
            enrollmentYear: number;
            phone: string | null;
            address: string | null;
            birthDate: Date | null;
            groupId: number | null;
            userId: number;
        } | null;
        teacher: {
            createdAt: Date;
            updatedAt: Date;
            id: number;
            firstName: string;
            lastName: string;
            middleName: string | null;
            phone: string | null;
            department: string;
            position: string;
            academicDegree: string | null;
            officeNumber: string | null;
            userId: number;
        } | null;
    }>;
    logout(user: AuthUser, res: Response): Promise<{
        message: string;
    }>;
}
