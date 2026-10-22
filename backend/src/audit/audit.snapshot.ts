import { Grade } from '@prisma/client';

/**
 * What the audit log keeps of a grade: the fields a person can change plus the keys that identify it.
 * Dates are ISO strings (JSON has no Date).
 */
export type GradeSnapshot = {
  studentId: number;
  subjectId: number;
  gradeType: Grade['gradeType'];
  gradeValue: number;
  examDate: string | null;
  notes: string | null;
  teacherId: number | null;
};

/** Copies the audited fields of a grade row */
export function snapshotGrade(
  grade: Pick<Grade, 'studentId' | 'subjectId' | 'gradeType' | 'gradeValue' | 'examDate' | 'notes' | 'teacherId'>,
): GradeSnapshot {
  return {
    studentId: grade.studentId,
    subjectId: grade.subjectId,
    gradeType: grade.gradeType,
    gradeValue: grade.gradeValue,
    examDate: grade.examDate ? grade.examDate.toISOString() : null,
    notes: grade.notes ?? null,
    teacherId: grade.teacherId ?? null,
  };
}

/** True when an edit changed something a reader of the log cares about (the value, the date, the note) */
export function gradeChanged(before: GradeSnapshot, after: GradeSnapshot): boolean {
  return (
    before.gradeValue !== after.gradeValue ||
    before.gradeType !== after.gradeType ||
    before.subjectId !== after.subjectId ||
    before.examDate !== after.examDate ||
    before.notes !== after.notes
  );
}
