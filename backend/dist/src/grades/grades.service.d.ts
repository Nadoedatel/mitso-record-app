import { PrismaService } from '../prisma/prisma.service';
import { CreateGradeDto, UpdateGradeDto, QueryGradeDto } from './dto';
import { PaginatedResponse } from '../common/dto';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
export declare class GradesService {
    private prisma;
    constructor(prisma: PrismaService);
    private assertTeacherOwnsSubject;
    private getTeacherId;
    create(dto: CreateGradeDto, user: AuthUser): Promise<{
        student: {
            createdAt: Date;
            updatedAt: Date;
            id: number;
            studentId: string;
            userId: number;
            firstName: string;
            lastName: string;
            middleName: string | null;
            groupId: number | null;
            course: number;
            specializationId: number | null;
            enrollmentYear: number;
            phone: string | null;
            address: string | null;
            birthDate: Date | null;
        };
        subject: {
            createdAt: Date;
            updatedAt: Date;
            id: number;
            name: string;
            code: string;
            credits: number;
            semester: number;
            description: string | null;
        };
        teacher: {
            createdAt: Date;
            updatedAt: Date;
            id: number;
            userId: number;
            firstName: string;
            lastName: string;
            middleName: string | null;
            phone: string | null;
            department: string;
            position: string;
            academicDegree: string | null;
            officeNumber: string | null;
        } | null;
    } & {
        gradeValue: number;
        gradeType: import(".prisma/client").$Enums.GradeType;
        examDate: Date | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        studentId: number;
        subjectId: number;
        teacherId: number | null;
    }>;
    findAll(query: QueryGradeDto, user: AuthUser): Promise<PaginatedResponse<any>>;
    findByStudent(studentId: number, user: AuthUser): Promise<({
        subject: {
            createdAt: Date;
            updatedAt: Date;
            id: number;
            name: string;
            code: string;
            credits: number;
            semester: number;
            description: string | null;
        };
        teacher: {
            createdAt: Date;
            updatedAt: Date;
            id: number;
            userId: number;
            firstName: string;
            lastName: string;
            middleName: string | null;
            phone: string | null;
            department: string;
            position: string;
            academicDegree: string | null;
            officeNumber: string | null;
        } | null;
    } & {
        gradeValue: number;
        gradeType: import(".prisma/client").$Enums.GradeType;
        examDate: Date | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        studentId: number;
        subjectId: number;
        teacherId: number | null;
    })[]>;
    findOne(id: number): Promise<{
        student: {
            createdAt: Date;
            updatedAt: Date;
            id: number;
            studentId: string;
            userId: number;
            firstName: string;
            lastName: string;
            middleName: string | null;
            groupId: number | null;
            course: number;
            specializationId: number | null;
            enrollmentYear: number;
            phone: string | null;
            address: string | null;
            birthDate: Date | null;
        };
        subject: {
            createdAt: Date;
            updatedAt: Date;
            id: number;
            name: string;
            code: string;
            credits: number;
            semester: number;
            description: string | null;
        };
        teacher: {
            createdAt: Date;
            updatedAt: Date;
            id: number;
            userId: number;
            firstName: string;
            lastName: string;
            middleName: string | null;
            phone: string | null;
            department: string;
            position: string;
            academicDegree: string | null;
            officeNumber: string | null;
        } | null;
    } & {
        gradeValue: number;
        gradeType: import(".prisma/client").$Enums.GradeType;
        examDate: Date | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        studentId: number;
        subjectId: number;
        teacherId: number | null;
    }>;
    update(id: number, dto: UpdateGradeDto): Promise<{
        student: {
            createdAt: Date;
            updatedAt: Date;
            id: number;
            studentId: string;
            userId: number;
            firstName: string;
            lastName: string;
            middleName: string | null;
            groupId: number | null;
            course: number;
            specializationId: number | null;
            enrollmentYear: number;
            phone: string | null;
            address: string | null;
            birthDate: Date | null;
        };
        subject: {
            createdAt: Date;
            updatedAt: Date;
            id: number;
            name: string;
            code: string;
            credits: number;
            semester: number;
            description: string | null;
        };
        teacher: {
            createdAt: Date;
            updatedAt: Date;
            id: number;
            userId: number;
            firstName: string;
            lastName: string;
            middleName: string | null;
            phone: string | null;
            department: string;
            position: string;
            academicDegree: string | null;
            officeNumber: string | null;
        } | null;
    } & {
        gradeValue: number;
        gradeType: import(".prisma/client").$Enums.GradeType;
        examDate: Date | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        studentId: number;
        subjectId: number;
        teacherId: number | null;
    }>;
    remove(id: number): Promise<{
        message: string;
    }>;
    findGroupsBySubject(subjectId: number): Promise<{
        id: number;
        name: string;
        course: number;
        facultyId: number | null;
        faculty: {
            id: number;
            name: string;
        } | null;
        studentCount: number;
    }[]>;
    findStudentsByGroupAndSubject(groupId: number, subjectId: number): Promise<({
        user: {
            id: number;
            email: string;
        };
        group: {
            id: number;
            name: string;
            course: number;
        } | null;
        grades: ({
            subject: {
                id: number;
                name: string;
                code: string;
            };
        } & {
            gradeValue: number;
            gradeType: import(".prisma/client").$Enums.GradeType;
            examDate: Date | null;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            id: number;
            studentId: number;
            subjectId: number;
            teacherId: number | null;
        })[];
    } & {
        createdAt: Date;
        updatedAt: Date;
        id: number;
        studentId: string;
        userId: number;
        firstName: string;
        lastName: string;
        middleName: string | null;
        groupId: number | null;
        course: number;
        specializationId: number | null;
        enrollmentYear: number;
        phone: string | null;
        address: string | null;
        birthDate: Date | null;
    })[]>;
    batchCreate(grades: CreateGradeDto[], user: AuthUser): Promise<{
        total: number;
        succeeded: number;
        failed: number;
        errors: {
            reason: any;
        }[];
        data: (({
            student: {
                id: number;
                studentId: string;
                firstName: string;
                lastName: string;
            };
            subject: {
                id: number;
                name: string;
                code: string;
            };
        } & {
            gradeValue: number;
            gradeType: import(".prisma/client").$Enums.GradeType;
            examDate: Date | null;
            notes: string | null;
            createdAt: Date;
            updatedAt: Date;
            id: number;
            studentId: number;
            subjectId: number;
            teacherId: number | null;
        }) | null)[];
    }>;
}
