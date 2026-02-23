import { GradesService } from './grades.service';
import { CreateGradeDto, UpdateGradeDto, QueryGradeDto, BatchCreateGradeDto } from './dto';
export declare class GradesController {
    private gradesService;
    constructor(gradesService: GradesService);
    create(dto: CreateGradeDto): Promise<{
        student: {
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
    batchCreate(dto: BatchCreateGradeDto): Promise<{
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
    findAll(query: QueryGradeDto): Promise<import("../common/dto").PaginatedResponse<any>>;
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
}
