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
        id: number;
        userId: number;
        firstName: string;
        lastName: string;
        middleName: string | null;
        department: string;
        position: string;
        academicDegree: string | null;
        phone: string | null;
        officeNumber: string | null;
        createdAt: Date;
        updatedAt: Date;
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
                grades: ({
                    student: {
                        id: number;
                        firstName: string;
                        lastName: string;
                        studentId: string;
                    };
                } & {
                    id: number;
                    createdAt: Date;
                    updatedAt: Date;
                    studentId: number;
                    subjectId: number;
                    gradeValue: number;
                    gradeType: import(".prisma/client").$Enums.GradeType;
                    examDate: Date | null;
                    notes: string | null;
                })[];
                subjectGroups: ({
                    group: {
                        name: string;
                        id: number;
                        createdAt: Date;
                        updatedAt: Date;
                        course: number;
                        facultyId: number | null;
                    };
                } & {
                    id: number;
                    createdAt: Date;
                    groupId: number;
                    subjectId: number;
                })[];
            } & {
                name: string;
                id: number;
                createdAt: Date;
                updatedAt: Date;
                code: string;
                credits: number;
                semester: number;
                description: string | null;
            };
        } & {
            id: number;
            createdAt: Date;
            teacherId: number;
            subjectId: number;
        })[];
    } & {
        id: number;
        userId: number;
        firstName: string;
        lastName: string;
        middleName: string | null;
        department: string;
        position: string;
        academicDegree: string | null;
        phone: string | null;
        officeNumber: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: number, dto: UpdateTeacherDto): Promise<{
        user: {
            id: number;
            email: string;
            role: import(".prisma/client").$Enums.Role;
        };
    } & {
        id: number;
        userId: number;
        firstName: string;
        lastName: string;
        middleName: string | null;
        department: string;
        position: string;
        academicDegree: string | null;
        phone: string | null;
        officeNumber: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: number): Promise<{
        message: string;
    }>;
    getSubjects(id: number): Promise<({
        grades: {
            id: number;
            gradeValue: number;
            gradeType: import(".prisma/client").$Enums.GradeType;
        }[];
        subjectGroups: ({
            group: {
                name: string;
                id: number;
                createdAt: Date;
                updatedAt: Date;
                course: number;
                facultyId: number | null;
            };
        } & {
            id: number;
            createdAt: Date;
            groupId: number;
            subjectId: number;
        })[];
    } & {
        name: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        credits: number;
        semester: number;
        description: string | null;
    })[]>;
    setSubjects(id: number, dto: AssignSubjectsDto): Promise<({
        grades: {
            id: number;
            gradeValue: number;
            gradeType: import(".prisma/client").$Enums.GradeType;
        }[];
        subjectGroups: ({
            group: {
                name: string;
                id: number;
                createdAt: Date;
                updatedAt: Date;
                course: number;
                facultyId: number | null;
            };
        } & {
            id: number;
            createdAt: Date;
            groupId: number;
            subjectId: number;
        })[];
    } & {
        name: string;
        id: number;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        credits: number;
        semester: number;
        description: string | null;
    })[]>;
    removeSubject(id: number, subjectId: number): Promise<{
        message: string;
    }>;
}
