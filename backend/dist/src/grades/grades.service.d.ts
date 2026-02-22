import { PrismaService } from '../prisma/prisma.service';
import { CreateGradeDto, UpdateGradeDto, QueryGradeDto } from './dto';
import { PaginatedResponse } from '../common/dto';
export declare class GradesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateGradeDto): Promise<{
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
        };
        subject: {
            teacherSubjects: ({
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
                };
            } & {
                createdAt: Date;
                id: number;
                teacherId: number;
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
        updatedAt: Date;
        id: number;
        studentId: number;
        notes: string | null;
        examDate: Date | null;
        subjectId: number;
        gradeValue: number;
        gradeType: import(".prisma/client").$Enums.GradeType;
    }>;
    findAll(query: QueryGradeDto): Promise<PaginatedResponse<any>>;
    findByStudent(studentId: number): Promise<({
        subject: {
            teacherSubjects: ({
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
                };
            } & {
                createdAt: Date;
                id: number;
                teacherId: number;
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
        updatedAt: Date;
        id: number;
        studentId: number;
        notes: string | null;
        examDate: Date | null;
        subjectId: number;
        gradeValue: number;
        gradeType: import(".prisma/client").$Enums.GradeType;
    })[]>;
    findOne(id: number): Promise<{
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
        };
        subject: {
            teacherSubjects: ({
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
                };
            } & {
                createdAt: Date;
                id: number;
                teacherId: number;
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
        updatedAt: Date;
        id: number;
        studentId: number;
        notes: string | null;
        examDate: Date | null;
        subjectId: number;
        gradeValue: number;
        gradeType: import(".prisma/client").$Enums.GradeType;
    }>;
    update(id: number, dto: UpdateGradeDto): Promise<{
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
        };
        subject: {
            teacherSubjects: ({
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
                };
            } & {
                createdAt: Date;
                id: number;
                teacherId: number;
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
        updatedAt: Date;
        id: number;
        studentId: number;
        notes: string | null;
        examDate: Date | null;
        subjectId: number;
        gradeValue: number;
        gradeType: import(".prisma/client").$Enums.GradeType;
    }>;
    remove(id: number): Promise<{
        message: string;
    }>;
    batchCreate(grades: CreateGradeDto[]): Promise<{
        total: number;
        succeeded: number;
        failed: number;
        errors: {
            reason: any;
        }[];
        data: (({
            student: {
                id: number;
                firstName: string;
                lastName: string;
                studentId: string;
            };
            subject: {
                name: string;
                id: number;
                code: string;
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
        }) | null)[];
    }>;
}
