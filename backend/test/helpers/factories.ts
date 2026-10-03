import * as bcrypt from 'bcrypt';
import { GradeType, Role, User } from '@prisma/client';
import { PrismaService } from '../../src/prisma/prisma.service';

export const DEFAULT_PASSWORD = 'password123';

/**
 * Inserts a user straight into the DB (faster and more isolated than going through the API).
 * bcrypt cost 4 instead of 10: hashing is the slowest part of a test and security is irrelevant here.
 */
export async function createUser(
  prisma: PrismaService,
  overrides: Partial<Pick<User, 'email' | 'role'>> & { password?: string } = {},
): Promise<User> {
  const { password = DEFAULT_PASSWORD, ...rest } = overrides;
  return prisma.user.create({
    data: {
      email: `user${Date.now()}${Math.random().toString(36).slice(2, 6)}@mitso.by`,
      role: Role.STUDENT,
      ...rest,
      password: await bcrypt.hash(password, 4),
    },
  });
}

let seq = 0;
const next = () => ++seq;

/** Creates a STUDENT user together with its student profile. */
export async function createStudent(
  prisma: PrismaService,
  overrides: { groupId?: number } = {},
) {
  const n = next();
  const user = await createUser(prisma, { role: Role.STUDENT });
  const student = await prisma.student.create({
    data: {
      userId: user.id,
      firstName: `Student${n}`,
      lastName: `Test${n}`,
      studentId: `ST-${n}`,
      course: 1,
      enrollmentYear: 2025,
      groupId: overrides.groupId,
    },
  });
  return { user, student };
}

/** Creates a TEACHER user together with its teacher profile. */
export async function createTeacher(prisma: PrismaService) {
  const n = next();
  const user = await createUser(prisma, { role: Role.TEACHER });
  const teacher = await prisma.teacher.create({
    data: {
      userId: user.id,
      firstName: `Teacher${n}`,
      lastName: `Test${n}`,
      department: 'IT',
      position: 'Lecturer',
    },
  });
  return { user, teacher };
}

export async function createSubject(prisma: PrismaService) {
  const n = next();
  return prisma.subject.create({
    data: { name: `Subject ${n}`, code: `SUBJ-${n}`, credits: 3, semester: 1 },
  });
}

export async function createGroup(prisma: PrismaService) {
  return prisma.group.create({ data: { name: `Group-${next()}`, course: 1 } });
}

/** Makes a teacher responsible for a subject (required to grade it). */
export async function assignTeacher(prisma: PrismaService, teacherId: number, subjectId: number) {
  return prisma.teacherSubject.create({ data: { teacherId, subjectId } });
}

export async function createGrade(
  prisma: PrismaService,
  data: { studentId: number; subjectId: number; gradeValue?: number; gradeType?: GradeType },
) {
  return prisma.grade.create({
    data: { gradeValue: 8, gradeType: GradeType.EXAM, ...data },
  });
}
