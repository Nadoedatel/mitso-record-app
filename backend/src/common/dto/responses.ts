import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * Response schemas: they only DESCRIBE what the services return, for OpenAPI and the generated
 * frontend client. Nothing parses responses with them, so runtime behaviour is unchanged.
 * Dates are strings because JSON has no Date. Relations are optional: each endpoint includes its own subset.
 */

const iso = z.string().meta({ example: '2026-01-15T10:00:00.000Z' });
const role = z.enum(['STUDENT', 'TEACHER', 'ADMIN']);
const gradeType = z.enum(['EXAM', 'CREDIT', 'COURSEWORK', 'TEST', 'LAB']);

/** `{ message }` returned by delete and similar endpoints */
export const messageSchema = z.object({ message: z.string() });
export class MessageResponseDto extends createZodDto(messageSchema) {}

/** Page of a list read by cursor: no total (counting a growing table is slow), `nextCursor` is null on the last page */
export const cursorPaginated = <T extends z.ZodType>(item: T) =>
  z.object({
    data: z.array(item),
    nextCursor: z.string().nullable().meta({ description: 'Pass it as `cursor` to get the next page; null on the last page' }),
    limit: z.number().int(),
  });

/** Page of a list endpoint: `{ data, total, page, limit, totalPages }` */
export const paginated = <T extends z.ZodType>(item: T) =>
  z.object({
    data: z.array(item),
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int(),
    totalPages: z.number().int(),
  });

// Entities without relations

export const userSummarySchema = z.object({ id: z.number().int(), email: z.string(), role });

export const facultyBaseSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  createdAt: iso,
  updatedAt: iso,
});

export const specializationBaseSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  code: z.string().nullable(),
  facultyId: z.number().int(),
  createdAt: iso,
  updatedAt: iso,
});

export const groupBaseSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  course: z.number().int(),
  facultyId: z.number().int().nullable(),
  createdAt: iso,
  updatedAt: iso,
});

export const studentBaseSchema = z.object({
  id: z.number().int(),
  userId: z.number().int(),
  firstName: z.string(),
  lastName: z.string(),
  middleName: z.string().nullable(),
  studentId: z.string().meta({ description: 'Номер зачётной книжки' }),
  groupId: z.number().int().nullable(),
  course: z.number().int(),
  specializationId: z.number().int().nullable(),
  enrollmentYear: z.number().int(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  birthDate: iso.nullable(),
  createdAt: iso,
  updatedAt: iso,
});

export const teacherBaseSchema = z.object({
  id: z.number().int(),
  userId: z.number().int(),
  firstName: z.string(),
  lastName: z.string(),
  middleName: z.string().nullable(),
  department: z.string(),
  position: z.string(),
  academicDegree: z.string().nullable(),
  phone: z.string().nullable(),
  officeNumber: z.string().nullable(),
  createdAt: iso,
  updatedAt: iso,
});

export const subjectBaseSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  code: z.string(),
  credits: z.number().int(),
  semester: z.number().int(),
  description: z.string().nullable(),
  createdAt: iso,
  updatedAt: iso,
});

export const gradeBaseSchema = z.object({
  id: z.number().int(),
  studentId: z.number().int(),
  subjectId: z.number().int(),
  teacherId: z.number().int().nullable(),
  gradeValue: z.number().int().meta({ description: '1-10; для CREDIT: 1 = зачёт, 0 = не зачёт' }),
  gradeType,
  examDate: iso.nullable(),
  notes: z.string().nullable(),
  createdAt: iso,
  updatedAt: iso,
});

// Entities with the relations the endpoints include (one level deeper than the base)

export const facultySchema = facultyBaseSchema.extend({
  _count: z.object({ specializations: z.number().int(), groups: z.number().int() }).optional(),
  specializations: z.array(specializationBaseSchema).optional(),
  groups: z.array(groupBaseSchema).optional(),
});

export const specializationSchema = specializationBaseSchema.extend({
  faculty: facultyBaseSchema.optional(),
  _count: z.object({ students: z.number().int() }).optional(),
});

export const groupSchema = groupBaseSchema.extend({
  faculty: facultyBaseSchema.nullable().optional(),
  studentCount: z.number().int().optional(),
  students: z.array(studentBaseSchema).optional(),
  subjectGroups: z.array(z.object({ subject: subjectBaseSchema })).optional(),
});

export const teacherSchema = teacherBaseSchema.extend({
  user: userSummarySchema.optional(),
  teacherSubjects: z.array(z.object({ subject: subjectBaseSchema })).optional(),
});

export const subjectSchema = subjectBaseSchema.extend({
  teacherSubjects: z.array(z.object({ teacher: teacherSchema })).optional(),
  subjectGroups: z.array(z.object({ group: groupSchema })).optional(),
  grades: z.array(gradeBaseSchema.pick({ id: true, gradeValue: true, gradeType: true })).optional(),
});

export const gradeSchema = gradeBaseSchema.extend({
  student: studentBaseSchema.optional(),
  subject: subjectBaseSchema.optional(),
  teacher: teacherBaseSchema.nullable().optional(),
});

export const studentSchema = studentBaseSchema.extend({
  user: userSummarySchema.optional(),
  group: groupSchema.nullable().optional(),
  specialization: specializationSchema.nullable().optional(),
  grades: z.array(gradeSchema).optional(),
});

/** `GET /auth/me`: the account with its student or teacher profile */
export const meSchema = userSummarySchema.extend({
  student: studentSchema.nullable(),
  teacher: teacherSchema.nullable(),
  twoFactorEnabled: z.boolean().meta({ description: 'Whether the second login factor (authenticator app) is on' }),
});

/** What the audit log keeps of a grade before and after a change */
export const gradeSnapshotSchema = z.object({
  studentId: z.number().int(),
  subjectId: z.number().int(),
  gradeType,
  gradeValue: z.number().int(),
  examDate: iso.nullable(),
  notes: z.string().nullable(),
  teacherId: z.number().int().nullable(),
});

/** `GET /audit-log`: one record of who changed a grade */
export const auditLogSchema = z.object({
  id: z.number().int(),
  createdAt: iso,
  actorId: z.number().int().nullable().meta({ description: 'Null after the user was deleted; actorEmail stays' }),
  actorEmail: z.string(),
  actorRole: role,
  action: z.enum(['GRADE_CREATE', 'GRADE_UPDATE', 'GRADE_DELETE']),
  entityId: z.number().int().nullable(),
  studentId: z.number().int().nullable(),
  subjectId: z.number().int().nullable(),
  studentName: z.string().nullable().meta({ description: 'Current name; null if the student was deleted' }),
  subjectName: z.string().nullable().meta({ description: 'Current name; null if the subject was deleted' }),
  before: gradeSnapshotSchema.nullable(),
  after: gradeSnapshotSchema.nullable(),
});

export class FacultyResponseDto extends createZodDto(facultySchema) {}
export class FacultyListResponseDto extends createZodDto(paginated(facultySchema)) {}
export class SpecializationResponseDto extends createZodDto(specializationSchema) {}
export class SpecializationListResponseDto extends createZodDto(paginated(specializationSchema)) {}
export class GroupResponseDto extends createZodDto(groupSchema) {}
export class GroupListResponseDto extends createZodDto(paginated(groupSchema)) {}
export class StudentResponseDto extends createZodDto(studentSchema) {}
export class StudentListResponseDto extends createZodDto(paginated(studentSchema)) {}
export class TeacherResponseDto extends createZodDto(teacherSchema) {}
export class TeacherListResponseDto extends createZodDto(paginated(teacherSchema)) {}
export class SubjectResponseDto extends createZodDto(subjectSchema) {}
export class SubjectListResponseDto extends createZodDto(paginated(subjectSchema)) {}
export class GradeResponseDto extends createZodDto(gradeSchema) {}
export class GradeListResponseDto extends createZodDto(paginated(gradeSchema)) {}
export class AuditLogListResponseDto extends createZodDto(cursorPaginated(auditLogSchema)) {}
export class MeResponseDto extends createZodDto(meSchema) {}

/**
 * `POST /auth/login` and `POST /auth/2fa/verify`.
 * Normal login: `user` and `accessToken`. With the second factor on, the password step answers
 * `twoFactorRequired: true` and a `challengeToken` instead (no session yet).
 */
export class LoginResponseDto extends createZodDto(
  z.object({
    user: userSummarySchema.optional(),
    accessToken: z.string().optional(),
    twoFactorRequired: z.boolean().optional(),
    challengeToken: z.string().optional().meta({ description: 'Send it with the code to POST /auth/2fa/verify; valid for 5 minutes' }),
  }),
) {}

/** `POST /auth/2fa/setup`: what the user adds to the authenticator app */
export class TwoFactorSetupResponseDto extends createZodDto(
  z.object({
    secret: z.string().meta({ description: 'The secret as text, for typing into the app by hand' }),
    otpauthUri: z.string(),
    qrCode: z.string().meta({ description: 'PNG data URL of the QR code' }),
  }),
) {}

/** `POST /auth/2fa/enable`: shown once, the server keeps only hashes */
export class RecoveryCodesResponseDto extends createZodDto(z.object({ recoveryCodes: z.array(z.string()) })) {}

/** `POST /auth/refresh` */
export class RefreshResponseDto extends createZodDto(z.object({ accessToken: z.string() })) {}

/** `POST /grades/batch` */
export class GradeBatchResultResponseDto extends createZodDto(
  z.object({
    total: z.number().int(),
    succeeded: z.number().int(),
    failed: z.number().int(),
    errors: z.array(z.object({ index: z.number().int(), reason: z.string() })),
    data: z.array(gradeSchema),
  }),
) {}
