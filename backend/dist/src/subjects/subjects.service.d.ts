import { PrismaService } from '../prisma/prisma.service';
import { CreateSubjectDto, UpdateSubjectDto } from './dto';
export declare class SubjectsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateSubjectDto): Promise<{
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
        updatedAt: Date;
        id: number;
        name: string;
        code: string;
        credits: number;
        semester: number;
        description: string | null;
        teacherId: number;
    }>;
    findAll(teacherId?: number, semester?: number): Promise<({
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
        grades: {
            createdAt: Date;
            updatedAt: Date;
            id: number;
            studentId: number;
            notes: string | null;
            examDate: Date | null;
            subjectId: number;
            gradeValue: number;
            gradeType: import(".prisma/client").$Enums.GradeType;
        }[];
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
    })[]>;
    findOne(id: number): Promise<{
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
    }>;
    update(id: number, dto: UpdateSubjectDto): Promise<{
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
        updatedAt: Date;
        id: number;
        name: string;
        code: string;
        credits: number;
        semester: number;
        description: string | null;
        teacherId: number;
    }>;
    remove(id: number): Promise<{
        message: string;
    }>;
}
