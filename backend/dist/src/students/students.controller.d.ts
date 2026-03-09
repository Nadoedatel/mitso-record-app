import { StudentsService } from './students.service';
import { CreateStudentDto, UpdateStudentDto, QueryStudentDto } from './dto';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
export declare class StudentsController {
    private studentsService;
    constructor(studentsService: StudentsService);
    create(dto: CreateStudentDto): Promise<{
        user: {
            id: number;
            email: string;
            role: import(".prisma/client").$Enums.Role;
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
    }>;
    findAll(query: QueryStudentDto): Promise<import("../common/dto").PaginatedResponse<any>>;
    findOne(id: number, user: AuthUser): Promise<{
        specialization: {
            name: string;
            id: number;
            faculty: {
                name: string;
                id: number;
            };
            code: string | null;
        } | null;
        group: {
            name: string;
            id: number;
            faculty: {
                name: string;
                id: number;
            } | null;
            course: number;
        } | null;
        grades: ({
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
            teacherId: number | null;
            subjectId: number;
            examDate: Date | null;
            gradeValue: number;
            gradeType: import(".prisma/client").$Enums.GradeType;
        })[];
        user: {
            id: number;
            email: string;
            role: import(".prisma/client").$Enums.Role;
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
    }>;
    update(id: number, dto: UpdateStudentDto): Promise<{
        specialization: {
            name: string;
            id: number;
            faculty: {
                name: string;
                id: number;
            };
            code: string | null;
        } | null;
        group: {
            name: string;
            id: number;
            faculty: {
                name: string;
                id: number;
            } | null;
            course: number;
        } | null;
        user: {
            id: number;
            email: string;
            role: import(".prisma/client").$Enums.Role;
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
    }>;
    remove(id: number): Promise<{
        message: string;
    }>;
}
