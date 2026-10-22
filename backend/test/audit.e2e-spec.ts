import * as request from 'supertest';
import { AuditAction, GradeType, Role } from '@prisma/client';
import { createTestApp, resetDb, TestApp } from './helpers/app';
import { bearerFor } from './helpers/auth';
import { assignTeacher, createGrade, createStudent, createSubject, createTeacher, createUser } from './helpers/factories';

/** Every change of a grade leaves a record (who, what before and after), written together with the change. */
describe('Audit log (e2e)', () => {
  let ctx: TestApp;
  const http = () => request(ctx.app.getHttpServer());

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  beforeEach(async () => {
    await resetDb(ctx.prisma, ctx.cache);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  async function scene() {
    const subject = await createSubject(ctx.prisma);
    const teacher = await createTeacher(ctx.prisma);
    await assignTeacher(ctx.prisma, teacher.teacher.id, subject.id);
    const student = await createStudent(ctx.prisma);
    const admin = await createUser(ctx.prisma, { role: Role.ADMIN });
    return { subject, teacher, student, admin, adminAuth: await bearerFor(ctx.app, admin) };
  }

  const log = (auth: string, query = '') => http().get(`/api/audit-log${query}`).set('Authorization', auth).expect(200);

  it('records a grade set by a teacher: who, role, student, subject and the new values', async () => {
    const { subject, teacher, student, adminAuth } = await scene();
    const teacherAuth = await bearerFor(ctx.app, teacher.user);

    await http()
      .post('/api/grades')
      .set('Authorization', teacherAuth)
      .send({ studentId: student.student.id, subjectId: subject.id, gradeType: GradeType.EXAM, gradeValue: 9 })
      .expect(201);

    const { body } = await log(adminAuth);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({
      action: 'GRADE_CREATE',
      actorId: teacher.user.id,
      actorEmail: teacher.user.email,
      actorRole: 'TEACHER',
      studentId: student.student.id,
      studentName: `${student.student.lastName} ${student.student.firstName}`,
      subjectId: subject.id,
      subjectName: subject.name,
      before: null,
      after: { gradeValue: 9, gradeType: 'EXAM' },
    });
  });

  it('records an edit with the value before and after, and a deletion with the deleted value', async () => {
    const { subject, student, adminAuth } = await scene();
    const grade = await createGrade(ctx.prisma, { studentId: student.student.id, subjectId: subject.id, gradeValue: 5 });

    await http().patch(`/api/grades/${grade.id}`).set('Authorization', adminAuth).send({ gradeValue: 8 }).expect(200);
    await http().delete(`/api/grades/${grade.id}`).set('Authorization', adminAuth).expect(200);

    const { body } = await log(adminAuth);
    expect(body.data.map((r: { action: string }) => r.action)).toEqual(['GRADE_DELETE', 'GRADE_UPDATE']); // newest first
    expect(body.data[1]).toMatchObject({ before: { gradeValue: 5 }, after: { gradeValue: 8 } });
    expect(body.data[0]).toMatchObject({ entityId: grade.id, before: { gradeValue: 8 }, after: null });
    expect(await ctx.prisma.grade.count()).toBe(0);
  });

  it('batch: a new grade is a create, a changed one an update, an unchanged one leaves no record', async () => {
    const { subject, student, adminAuth } = await scene();
    const other = await createStudent(ctx.prisma);
    await createGrade(ctx.prisma, { studentId: student.student.id, subjectId: subject.id, gradeValue: 5 });
    await createGrade(ctx.prisma, { studentId: other.student.id, subjectId: subject.id, gradeValue: 7 });
    const third = await createStudent(ctx.prisma);

    await http()
      .post('/api/grades/batch')
      .set('Authorization', adminAuth)
      .send({
        grades: [
          { studentId: student.student.id, subjectId: subject.id, gradeType: 'EXAM', gradeValue: 9 },
          { studentId: other.student.id, subjectId: subject.id, gradeType: 'EXAM', gradeValue: 7 },
          { studentId: third.student.id, subjectId: subject.id, gradeType: 'EXAM', gradeValue: 6 },
        ],
      })
      .expect(201);

    const { body } = await log(adminAuth);
    expect(body.data).toHaveLength(2);
    expect(body.data.map((r: { action: string; studentId: number }) => [r.action, r.studentId]).sort()).toEqual(
      [
        ['GRADE_CREATE', third.student.id],
        ['GRADE_UPDATE', student.student.id],
      ].sort(),
    );
  });

  it('does not record a rejected change', async () => {
    const { subject, student, adminAuth } = await scene();

    await http()
      .post('/api/grades')
      .set('Authorization', adminAuth)
      .send({ studentId: student.student.id, subjectId: subject.id, gradeType: 'CREDIT', gradeValue: 7 })
      .expect(400);

    expect((await log(adminAuth)).body.data).toHaveLength(0);
  });

  it('filters by student, action and date', async () => {
    const { subject, student, adminAuth } = await scene();
    const other = await createStudent(ctx.prisma);
    // three creates: two for `student` (different types, a grade is unique per student + subject + type), one for `other`
    for (const [studentId, gradeType] of [
      [student.student.id, 'EXAM'],
      [student.student.id, 'LAB'],
      [other.student.id, 'EXAM'],
    ] as const) {
      await http()
        .post('/api/grades')
        .set('Authorization', adminAuth)
        .send({ studentId, subjectId: subject.id, gradeType, gradeValue: 8 })
        .expect(201);
    }
    await ctx.prisma.auditLog.create({
      data: {
        actorEmail: 'old@mitso.by',
        actorRole: Role.ADMIN,
        action: AuditAction.GRADE_DELETE,
        studentId: student.student.id,
        createdAt: new Date('2020-01-01T10:00:00Z'),
      },
    });

    expect((await log(adminAuth, `?studentId=${other.student.id}`)).body.data).toHaveLength(1);
    expect((await log(adminAuth, '?action=GRADE_DELETE')).body.data).toHaveLength(1);
    expect((await log(adminAuth, '?to=2020-01-01')).body.data).toHaveLength(1); // a plain date includes that whole day
    expect((await log(adminAuth, '?from=2021-01-01')).body.data.every((r: { action: string }) => r.action === 'GRADE_CREATE')).toBe(true);
  });

  it('pages by cursor: every record once, newest first, nothing skipped or repeated, and no cursor on the last page', async () => {
    const { subject, student, adminAuth } = await scene();
    const types = ['EXAM', 'LAB', 'TEST', 'COURSEWORK', 'CREDIT'] as const;
    for (const gradeType of types) {
      await http()
        .post('/api/grades')
        .set('Authorization', adminAuth)
        .send({ studentId: student.student.id, subjectId: subject.id, gradeType, gradeValue: gradeType === 'CREDIT' ? 1 : 7 })
        .expect(201);
    }

    const seen: number[] = [];
    let cursor: string | null = null;
    let pages = 0;
    do {
      const { body }: { body: { data: { id: number }[]; nextCursor: string | null } } = await log(
        adminAuth,
        `?limit=2${cursor ? `&cursor=${cursor}` : ''}`,
      );
      seen.push(...body.data.map((r) => r.id));
      cursor = body.nextCursor;
      pages++;
    } while (cursor && pages < 10);

    expect(pages).toBe(3); // 2 + 2 + 1
    expect(seen).toHaveLength(5);
    expect(new Set(seen).size).toBe(5);
    expect(seen).toEqual([...seen].sort((a, b) => b - a)); // newest first
  });

  it('pages correctly when many records share one timestamp (the id breaks the tie)', async () => {
    const { adminAuth } = await scene();
    const at = new Date('2024-05-05T12:00:00.000Z');
    for (let i = 0; i < 5; i++) {
      await ctx.prisma.auditLog.create({
        data: { actorEmail: 'bulk@mitso.by', actorRole: Role.ADMIN, action: AuditAction.GRADE_UPDATE, createdAt: at },
      });
    }

    const first = (await log(adminAuth, '?limit=3')).body;
    const second = (await log(adminAuth, `?limit=3&cursor=${first.nextCursor}`)).body;

    const ids = [...first.data, ...second.data].map((r: { id: number }) => r.id);
    expect(ids).toHaveLength(5);
    expect(new Set(ids).size).toBe(5);
    expect(second.nextCursor).toBeNull();
  });

  it('answers 400 for a cursor that is not ours', async () => {
    const { adminAuth } = await scene();
    await http().get('/api/audit-log?cursor=garbage').set('Authorization', adminAuth).expect(400);
  });

  it('keeps the record when the actor is deleted: actorId becomes null, the email stays', async () => {
    const { subject, student, adminAuth } = await scene();
    const teacher = await createTeacher(ctx.prisma);
    await assignTeacher(ctx.prisma, teacher.teacher.id, subject.id);
    await http()
      .post('/api/grades')
      .set('Authorization', await bearerFor(ctx.app, teacher.user))
      .send({ studentId: student.student.id, subjectId: subject.id, gradeType: 'EXAM', gradeValue: 8 })
      .expect(201);

    await ctx.prisma.user.delete({ where: { id: teacher.user.id } });

    const { body } = await log(adminAuth);
    expect(body.data[0]).toMatchObject({ actorId: null, actorEmail: teacher.user.email, actorRole: 'TEACHER' });
  });

  it('is closed to teachers and students', async () => {
    const { teacher, student } = await scene();
    await http().get('/api/audit-log').set('Authorization', await bearerFor(ctx.app, teacher.user)).expect(403);
    await http().get('/api/audit-log').set('Authorization', await bearerFor(ctx.app, student.user)).expect(403);
  });
});
