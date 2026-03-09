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
        } | null;
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
        updatedAt: Date;
        id: number;
        studentId: number;
        notes: string | null;
        teacherId: number | null;
        subjectId: number;
        examDate: Date | null;
        gradeValue: number;
        gradeType: import(".prisma/client").$Enums.GradeType;
    }>;
    findAll(query: QueryGradeDto, user: AuthUser): Promise<PaginatedResponse<any>>;
    findByStudent(studentId: number, user: AuthUser): Promise<({
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
        } | null;
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
        updatedAt: Date;
        id: number;
        studentId: number;
        notes: string | null;
        teacherId: number | null;
        subjectId: number;
        examDate: Date | null;
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
        } | null;
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
        updatedAt: Date;
        id: number;
        studentId: number;
        notes: string | null;
        teacherId: number | null;
        subjectId: number;
        examDate: Date | null;
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
        } | null;
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
        updatedAt: Date;
        id: number;
        studentId: number;
        notes: string | null;
        teacherId: number | null;
        subjectId: number;
        examDate: Date | null;
        gradeValue: number;
        gradeType: import(".prisma/client").$Enums.GradeType;
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
            name: string;
            id: number;
        } | null;
        studentCount: number;
    }[]>;
    findStudentsByGroupAndSubject(groupId: number, subjectId: number): Promise<({
        group: {
            name: string;
            id: number;
            course: number;
        } | null;
        grades: ({
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
            teacherId: number | null;
            subjectId: number;
            examDate: Date | null;
            gradeValue: number;
            gradeType: import(".prisma/client").$Enums.GradeType;
        })[];
        user: {
            id: number;
            email: string;
        };
    } & {
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
            teacherId: number | null;
            subjectId: number;
            examDate: Date | null;
            gradeValue: number;
            gradeType: import(".prisma/client").$Enums.GradeType;
        }) | null)[];
    }>;
}
