import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherDto, UpdateTeacherDto } from './dto';
export declare class TeachersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateTeacherDto): Promise<{
        user: {
            email: string;
            role: import(".prisma/client").$Enums.Role;
            id: number;
        };
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
    }>;
    findAll(search?: string): Promise<({
        user: {
            email: string;
            role: import(".prisma/client").$Enums.Role;
            id: number;
        };
        subjects: {
            createdAt: Date;
            updatedAt: Date;
            id: number;
            name: string;
            code: string;
            credits: number;
            semester: number;
            description: string | null;
            teacherId: number;
        }[];
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
    })[]>;
    findOne(id: number): Promise<{
        user: {
            email: string;
            role: import(".prisma/client").$Enums.Role;
            id: number;
        };
        subjects: ({
            grades: ({
                student: {
                    createdAt: Date;
                    updatedAt: Date;
                    id: number;
                    firstName: string;
                    lastName: string;
                    middleName: string | null;
                    studentId: string;
                    group: string;
                    course: number;
                    faculty: string;
                    specialization: string;
                    enrollmentYear: number;
                    phone: string | null;
                    address: string | null;
                    birthDate: Date | null;
                    userId: number;
                };
            } & {
                createdAt: Date;
                updatedAt: Date;
                id: number;
                studentId: number;
                notes: string | null;
                examDate: Date | null;
                subjectId: number;
                gradeValue: number;
                gradeType: import(".prisma/client").$Enums.GradeType;
            })[];
        } & {
            createdAt: Date;
            updatedAt: Date;
            id: number;
            name: string;
            code: string;
            credits: number;
            semester: number;
            description: string | null;
            teacherId: number;
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
    }>;
    findByUserId(userId: number): Promise<{
        user: {
            email: string;
            role: import(".prisma/client").$Enums.Role;
            id: number;
        };
        subjects: {
            createdAt: Date;
            updatedAt: Date;
            id: number;
            name: string;
            code: string;
            credits: number;
            semester: number;
            description: string | null;
            teacherId: number;
        }[];
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
    }>;
    update(id: number, dto: UpdateTeacherDto): Promise<{
        user: {
            email: string;
            role: import(".prisma/client").$Enums.Role;
            id: number;
        };
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
    }>;
    remove(id: number): Promise<{
        message: string;
    }>;
}
