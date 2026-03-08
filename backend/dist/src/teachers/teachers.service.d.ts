import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherDto, UpdateTeacherDto, QueryTeacherDto } from './dto';
import { PaginatedResponse } from '../common/dto';
export declare class TeachersService {
    private prisma;
    constructor(prisma: PrismaService);
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
    findAll(query: QueryTeacherDto): Promise<PaginatedResponse<any>>;
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
                    teacherId: number | null;
                    subjectId: number;
                    examDate: Date | null;
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
    findByUserId(userId: number): Promise<{
        user: {
            id: number;
            email: string;
            role: import(".prisma/client").$Enums.Role;
        };
        teacherSubjects: ({
            subject: {
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
    getSubjects(teacherId: number): Promise<({
        subjectGroups: ({
            group: {
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
    assignSubjects(teacherId: number, subjectIds: number[]): Promise<({
        subjectGroups: ({
            group: {
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
    removeSubject(teacherId: number, subjectId: number): Promise<{
        message: string;
    }>;
    setSubjects(teacherId: number, subjectIds: number[]): Promise<({
        subjectGroups: ({
            group: {
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
}
