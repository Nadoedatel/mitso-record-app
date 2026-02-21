import { GradeType } from '@prisma/client';
export declare class CreateGradeDto {
    studentId: number;
    subjectId: number;
    gradeValue: number;
    gradeType: GradeType;
    examDate?: string;
    notes?: string;
}
