import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: number;
            email: string;
            role: import(".prisma/client").$Enums.Role;
        };
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: number;
            email: string;
            role: import(".prisma/client").$Enums.Role;
        };
    }>;
    refresh(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    getMe(userId: number): Promise<{
        id: number;
        email: string;
        role: import(".prisma/client").$Enums.Role;
        student: ({
            specialization: ({
                faculty: {
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    id: number;
                };
            } & {
                name: string;
                createdAt: Date;
                updatedAt: Date;
                id: number;
                code: string | null;
                facultyId: number;
            }) | null;
            group: ({
                faculty: {
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    id: number;
                } | null;
            } & {
                name: string;
                createdAt: Date;
                updatedAt: Date;
                id: number;
                facultyId: number | null;
                course: number;
            }) | null;
        } & {
            createdAt: Date;
            updatedAt: Date;
            id: number;
            course: number;
            firstName: string;
            lastName: string;
            middleName: string | null;
            studentId: string;
            enrollmentYear: number;
            phone: string | null;
            address: string | null;
            birthDate: Date | null;
            groupId: number | null;
            specializationId: number | null;
            userId: number;
        }) | null;
        teacher: ({
            teacherSubjects: ({
                subject: {
                    subjectGroups: ({
                        group: {
                            faculty: {
                                name: string;
                                createdAt: Date;
                                updatedAt: Date;
                                id: number;
                            } | null;
                        } & {
                            name: string;
                            createdAt: Date;
                            updatedAt: Date;
                            id: number;
                            facultyId: number | null;
                            course: number;
                        };
                    } & {
                        createdAt: Date;
                        id: number;
                        groupId: number;
                        subjectId: number;
                    })[];
                } & {
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    id: number;
                    code: string;
                    credits: number;
                    semester: number;
                    description: string | null;
                };
            } & {
                createdAt: Date;
                id: number;
                teacherId: number;
                subjectId: number;
            })[];
        } & {
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
        }) | null;
    }>;
    logout(userId: number): Promise<{
        message: string;
    }>;
    private generateTokens;
    private updateRefreshToken;
}
