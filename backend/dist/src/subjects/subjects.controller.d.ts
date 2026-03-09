import { SubjectsService } from './subjects.service';
import { CreateSubjectDto, UpdateSubjectDto, QuerySubjectDto, AssignGroupsDto, SetSubjectTeachersDto } from './dto';
export declare class SubjectsController {
    private subjectsService;
    constructor(subjectsService: SubjectsService);
    create(dto: CreateSubjectDto): Promise<{
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
    }>;
    findAll(query: QuerySubjectDto): Promise<import("../common/dto").PaginatedResponse<any>>;
    findOne(id: number): Promise<{
        subjectGroups: ({
            group: {
                name: string;
                id: number;
                faculty: {
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    id: number;
                } | null;
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
        teacherSubjects: ({
            teacher: {
                id: number;
                firstName: string;
                lastName: string;
                department: string;
                position: string;
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
    }>;
    update(id: number, dto: UpdateSubjectDto): Promise<{
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
    }>;
    remove(id: number): Promise<{
        message: string;
    }>;
    assignGroups(id: number, dto: AssignGroupsDto): Promise<{
        subjectGroups: ({
            group: {
                name: string;
                id: number;
                faculty: {
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    id: number;
                } | null;
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
        teacherSubjects: ({
            teacher: {
                id: number;
                firstName: string;
                lastName: string;
                department: string;
                position: string;
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
    }>;
    getTeachers(id: number): Promise<({
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
    })[]>;
    setTeachers(id: number, dto: SetSubjectTeachersDto): Promise<({
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
    })[]>;
}
