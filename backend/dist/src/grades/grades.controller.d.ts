import { GradesService } from './grades.service';
import { CreateGradeDto, UpdateGradeDto } from './dto';
export declare class GradesController {
    private gradesService;
    constructor(gradesService: GradesService);
    create(dto: CreateGradeDto): Promise<{
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
        subject: {
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
    findAll(studentId?: number, subjectId?: number): Promise<({
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
        subject: {
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
    findByStudent(studentId: number): Promise<({
        subject: {
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
        subject: {
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
        subject: {
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
}
