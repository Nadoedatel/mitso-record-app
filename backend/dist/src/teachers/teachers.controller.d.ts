import { TeachersService } from './teachers.service';
import { CreateTeacherDto, UpdateTeacherDto, QueryTeacherDto, AssignSubjectsDto } from './dto';
export declare class TeachersController {
    private teachersService;
    constructor(teachersService: TeachersService);
    create(dto: CreateTeacherDto): Promise<{
        user: {
            id: number;
            email: string;
            role: import(".prisma/client").$Enums.Role;
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
    findAll(query: QueryTeacherDto): Promise<import("../common/dto").PaginatedResponse<any>>;
    findOne(id: number): Promise<{
        user: {
            id: number;
            email: string;
            role: import(".prisma/client").$Enums.Role;
        };
        teacherSubjects: ({
            subject: {
                subjectGroups: ({
                    group: {
                        name: string;
                        course: number;
                        faculty: string;
                        createdAt: Date;
                        updatedAt: Date;
                        id: number;
                    };
                } & {
                    createdAt: Date;
                    id: number;
                    groupId: number;
                    subjectId: number;
                })[];
                grades: ({
                    student: {
                        id: number;
                        firstName: string;
                        lastName: string;
                        studentId: string;
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
    }>;
    update(id: number, dto: UpdateTeacherDto): Promise<{
        user: {
            id: number;
            email: string;
            role: import(".prisma/client").$Enums.Role;
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
    getSubjects(id: number): Promise<({
        subjectGroups: ({
            group: {
                name: string;
                course: number;
                faculty: string;
                createdAt: Date;
                updatedAt: Date;
                id: number;
            };
        } & {
            createdAt: Date;
            id: number;
            groupId: number;
            subjectId: number;
        })[];
        grades: {
            id: number;
            gradeValue: number;
            gradeType: import(".prisma/client").$Enums.GradeType;
        }[];
    } & {
        name: string;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        code: string;
        credits: number;
        semester: number;
        description: string | null;
    })[]>;
    assignSubjects(id: number, dto: AssignSubjectsDto): Promise<({
        subjectGroups: ({
            group: {
                name: string;
                course: number;
                faculty: string;
                createdAt: Date;
                updatedAt: Date;
                id: number;
            };
        } & {
            createdAt: Date;
            id: number;
            groupId: number;
            subjectId: number;
        })[];
        grades: {
            id: number;
            gradeValue: number;
            gradeType: import(".prisma/client").$Enums.GradeType;
        }[];
    } & {
        name: string;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        code: string;
        credits: number;
        semester: number;
        description: string | null;
    })[]>;
    removeSubject(id: number, subjectId: number): Promise<{
        message: string;
    }>;
}
