import * as request from 'supertest';
import { Role } from '@prisma/client';
import { createTestApp, resetDb, TestApp } from './helpers/app';
import { bearerFor } from './helpers/auth';
import {
  assignTeacher,
  createGrade,
  createGroup,
  createStudent,
  createSubject,
  createTeacher,
  createUser,
} from './helpers/factories';

describe('Grades (e2e)', () => {
  let ctx: TestApp;
  const http = () => request(ctx.app.getHttpServer());

  /** Two teachers, each owning one subject, one student and one admin: the base scene for access tests. */
  async function scene() {
    const [subjectA, subjectB] = [await createSubject(ctx.prisma), await createSubject(ctx.prisma)];
    const teacherA = await createTeacher(ctx.prisma);
    const teacherB = await createTeacher(ctx.prisma);
    await assignTeacher(ctx.prisma, teacherA.teacher.id, subjectA.id);
    await assignTeacher(ctx.prisma, teacherB.teacher.id, subjectB.id);
    const student = await createStudent(ctx.prisma);
    const admin = await createUser(ctx.prisma, { role: Role.ADMIN });
    return { subjectA, subjectB, teacherA, teacherB, student, admin };
  }

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  beforeEach(async () => {
    await resetDb(ctx.prisma, ctx.cache);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  describe('POST /api/grades', () => {
    it('requires authentication', async () => {
      await http().post('/api/grades').send({}).expect(401);
    });

    it('forbids students', async () => {
      const { student, subjectA } = await scene();

      await http()
        .post('/api/grades')
        .set('Authorization', await bearerFor(ctx.app, student.user))
        .send({ studentId: student.student.id, subjectId: subjectA.id, gradeType: 'EXAM', gradeValue: 10 })
        .expect(403);
    });

    it('lets a teacher grade their own subject and records who graded', async () => {
      const { student, subjectA, teacherA } = await scene();

      const res = await http()
        .post('/api/grades')
        .set('Authorization', await bearerFor(ctx.app, teacherA.user))
        .send({ studentId: student.student.id, subjectId: subjectA.id, gradeType: 'EXAM', gradeValue: 9 })
        .expect(201);

      expect(res.body).toMatchObject({ gradeValue: 9, teacherId: teacherA.teacher.id });
    });

    it("forbids a teacher from grading someone else's subject", async () => {
      const { student, subjectB, teacherA } = await scene();

      await http()
        .post('/api/grades')
        .set('Authorization', await bearerFor(ctx.app, teacherA.user))
        .send({ studentId: student.student.id, subjectId: subjectB.id, gradeType: 'EXAM', gradeValue: 9 })
        .expect(403);

      expect(await ctx.prisma.grade.count()).toBe(0);
    });

    it('lets an admin grade any subject, without a teacher attached', async () => {
      const { student, subjectA, admin } = await scene();

      const res = await http()
        .post('/api/grades')
        .set('Authorization', await bearerFor(ctx.app, admin))
        .send({ studentId: student.student.id, subjectId: subjectA.id, gradeType: 'EXAM', gradeValue: 7 })
        .expect(201);

      expect(res.body.teacherId).toBeNull();
    });

    it.each([
      ['an exam above 10', 'EXAM', 11],
      ['an exam of 0', 'EXAM', 0],
      ['a credit of 5 (only 0 or 1 allowed)', 'CREDIT', 5],
    ])('rejects %s', async (_name, gradeType, gradeValue) => {
      const { student, subjectA, admin } = await scene();

      await http()
        .post('/api/grades')
        .set('Authorization', await bearerFor(ctx.app, admin))
        .send({ studentId: student.student.id, subjectId: subjectA.id, gradeType, gradeValue })
        .expect(400);
    });

    it('accepts a pass/fail credit', async () => {
      const { student, subjectA, admin } = await scene();

      await http()
        .post('/api/grades')
        .set('Authorization', await bearerFor(ctx.app, admin))
        .send({ studentId: student.student.id, subjectId: subjectA.id, gradeType: 'CREDIT', gradeValue: 1 })
        .expect(201);
    });

    it('answers 409 when the same student, subject and type are graded twice', async () => {
      const { student, subjectA, admin } = await scene();
      await createGrade(ctx.prisma, { studentId: student.student.id, subjectId: subjectA.id });

      await http()
        .post('/api/grades')
        .set('Authorization', await bearerFor(ctx.app, admin))
        .send({ studentId: student.student.id, subjectId: subjectA.id, gradeType: 'EXAM', gradeValue: 5 })
        .expect(409);
    });
  });

  describe('POST /api/grades/batch', () => {
    it('creates new grades and updates existing ones instead of duplicating them', async () => {
      const { student, subjectA, teacherA } = await scene();
      const auth = await bearerFor(ctx.app, teacherA.user);
      const row = { studentId: student.student.id, subjectId: subjectA.id, gradeType: 'EXAM' };

      await http().post('/api/grades/batch').set('Authorization', auth).send({ grades: [{ ...row, gradeValue: 4 }] }).expect(201);
      const res = await http().post('/api/grades/batch').set('Authorization', auth).send({ grades: [{ ...row, gradeValue: 9 }] }).expect(201);

      expect(res.body).toMatchObject({ total: 1, succeeded: 1, failed: 0 });
      const all = await ctx.prisma.grade.findMany();
      expect(all).toHaveLength(1);
      expect(all[0].gradeValue).toBe(9);
    });

    it('saves the valid rows and reports the invalid ones (partial success by design)', async () => {
      const { student, subjectA, admin } = await scene();
      const other = await createStudent(ctx.prisma);

      const res = await http()
        .post('/api/grades/batch')
        .set('Authorization', await bearerFor(ctx.app, admin))
        .send({
          grades: [
            { studentId: student.student.id, subjectId: subjectA.id, gradeType: 'CREDIT', gradeValue: 1 },
            { studentId: other.student.id, subjectId: subjectA.id, gradeType: 'CREDIT', gradeValue: 7 },
          ],
        })
        .expect(201);

      expect(res.body).toMatchObject({ total: 2, succeeded: 1, failed: 1 });
      expect(await ctx.prisma.grade.count()).toBe(1);
    });

    it('rejects the whole batch when one row is for a subject the teacher does not own', async () => {
      const { student, subjectA, subjectB, teacherA } = await scene();

      await http()
        .post('/api/grades/batch')
        .set('Authorization', await bearerFor(ctx.app, teacherA.user))
        .send({
          grades: [
            { studentId: student.student.id, subjectId: subjectA.id, gradeType: 'EXAM', gradeValue: 8 },
            { studentId: student.student.id, subjectId: subjectB.id, gradeType: 'EXAM', gradeValue: 8 },
          ],
        })
        .expect(403);

      expect(await ctx.prisma.grade.count()).toBe(0);
    });

    it('rejects an empty batch', async () => {
      const { admin } = await scene();

      await http()
        .post('/api/grades/batch')
        .set('Authorization', await bearerFor(ctx.app, admin))
        .send({ grades: [] })
        .expect(400);
    });
  });

  describe('GET /api/grades', () => {
    it("shows a student only their own grades, ignoring a foreign studentId filter", async () => {
      const { student, subjectA, subjectB } = await scene();
      const stranger = await createStudent(ctx.prisma);
      await createGrade(ctx.prisma, { studentId: student.student.id, subjectId: subjectA.id });
      await createGrade(ctx.prisma, { studentId: stranger.student.id, subjectId: subjectB.id });

      const res = await http()
        .get(`/api/grades?studentId=${stranger.student.id}`)
        .set('Authorization', await bearerFor(ctx.app, student.user))
        .expect(200);

      expect(res.body.total).toBe(1);
      expect(res.body.data[0].studentId).toBe(student.student.id);
    });

    it('lets a teacher filter by student', async () => {
      const { student, subjectA, teacherA } = await scene();
      const stranger = await createStudent(ctx.prisma);
      await createGrade(ctx.prisma, { studentId: student.student.id, subjectId: subjectA.id });
      await createGrade(ctx.prisma, { studentId: stranger.student.id, subjectId: subjectA.id });

      const res = await http()
        .get(`/api/grades?studentId=${student.student.id}`)
        .set('Authorization', await bearerFor(ctx.app, teacherA.user))
        .expect(200);

      expect(res.body.total).toBe(1);
    });

    it('paginates', async () => {
      const { student, admin } = await scene();
      for (let i = 0; i < 3; i++) {
        const subject = await createSubject(ctx.prisma);
        await createGrade(ctx.prisma, { studentId: student.student.id, subjectId: subject.id });
      }

      const res = await http()
        .get('/api/grades?page=2&limit=2')
        .set('Authorization', await bearerFor(ctx.app, admin))
        .expect(200);

      expect(res.body).toMatchObject({ total: 3, page: 2, limit: 2, totalPages: 2 });
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/grades/student/:id', () => {
    it("forbids a student from reading another student's grades", async () => {
      const { student } = await scene();
      const stranger = await createStudent(ctx.prisma);

      await http()
        .get(`/api/grades/student/${stranger.student.id}`)
        .set('Authorization', await bearerFor(ctx.app, student.user))
        .expect(403);
    });

    it('lets a student read their own grades', async () => {
      const { student, subjectA } = await scene();
      await createGrade(ctx.prisma, { studentId: student.student.id, subjectId: subjectA.id });

      const res = await http()
        .get(`/api/grades/student/${student.student.id}`)
        .set('Authorization', await bearerFor(ctx.app, student.user))
        .expect(200);

      expect(res.body).toHaveLength(1);
    });
  });

  describe('DELETE /api/grades/:id', () => {
    it('is admin-only', async () => {
      const { student, subjectA, teacherA, admin } = await scene();
      const grade = await createGrade(ctx.prisma, { studentId: student.student.id, subjectId: subjectA.id });

      await http().delete(`/api/grades/${grade.id}`).set('Authorization', await bearerFor(ctx.app, teacherA.user)).expect(403);
      await http().delete(`/api/grades/${grade.id}`).set('Authorization', await bearerFor(ctx.app, admin)).expect(200);
      expect(await ctx.prisma.grade.count()).toBe(0);
    });

    it('answers 404 for a missing grade', async () => {
      const { admin } = await scene();

      await http().delete('/api/grades/999999').set('Authorization', await bearerFor(ctx.app, admin)).expect(404);
    });
  });

  // Regression tests for access-control holes found in step 3 (fixed: ownership checks in GradesService).
  describe('access control regressions', () => {
    it("forbids a student from reading another student's grade by id (GET /grades/:id)", async () => {
      const { student, subjectA } = await scene();
      const stranger = await createStudent(ctx.prisma);
      const grade = await createGrade(ctx.prisma, { studentId: stranger.student.id, subjectId: subjectA.id });

      await http()
        .get(`/api/grades/${grade.id}`)
        .set('Authorization', await bearerFor(ctx.app, student.user))
        .expect(403);
    });

    it("forbids a teacher from editing a grade of someone else's subject (PATCH /grades/:id)", async () => {
      const { student, subjectB, teacherA } = await scene();
      const grade = await createGrade(ctx.prisma, { studentId: student.student.id, subjectId: subjectB.id, gradeValue: 5 });

      await http()
        .patch(`/api/grades/${grade.id}`)
        .set('Authorization', await bearerFor(ctx.app, teacherA.user))
        .send({ gradeValue: 10 })
        .expect(403);
    });

    it('forbids a student from listing a whole group with grades and emails', async () => {
      const group = await createGroup(ctx.prisma);
      const me = await createStudent(ctx.prisma, { groupId: group.id });
      const classmate = await createStudent(ctx.prisma, { groupId: group.id });
      const subject = await createSubject(ctx.prisma);
      await createGrade(ctx.prisma, { studentId: classmate.student.id, subjectId: subject.id });

      await http()
        .get(`/api/grades/subject/${subject.id}/group/${group.id}/students`)
        .set('Authorization', await bearerFor(ctx.app, me.user))
        .expect(403);
    });

    it('still lets a student read their own grade by id', async () => {
      const { student, subjectA } = await scene();
      const grade = await createGrade(ctx.prisma, { studentId: student.student.id, subjectId: subjectA.id });

      await http()
        .get(`/api/grades/${grade.id}`)
        .set('Authorization', await bearerFor(ctx.app, student.user))
        .expect(200);
    });

    it('still lets a teacher edit a grade of their own subject', async () => {
      const { student, subjectA, teacherA } = await scene();
      const grade = await createGrade(ctx.prisma, { studentId: student.student.id, subjectId: subjectA.id, gradeValue: 5 });

      const res = await http()
        .patch(`/api/grades/${grade.id}`)
        .set('Authorization', await bearerFor(ctx.app, teacherA.user))
        .send({ gradeValue: 10 })
        .expect(200);

      expect(res.body.gradeValue).toBe(10);
    });

    it("forbids a teacher from moving their own grade into someone else's subject", async () => {
      const { student, subjectA, subjectB, teacherA } = await scene();
      const grade = await createGrade(ctx.prisma, { studentId: student.student.id, subjectId: subjectA.id });

      await http()
        .patch(`/api/grades/${grade.id}`)
        .set('Authorization', await bearerFor(ctx.app, teacherA.user))
        .send({ subjectId: subjectB.id })
        .expect(403);
    });

    it('lets a teacher list a group only for a subject assigned to them', async () => {
      const { subjectA, subjectB, teacherA } = await scene();
      const group = await createGroup(ctx.prisma);
      const auth = await bearerFor(ctx.app, teacherA.user);

      await http().get(`/api/grades/subject/${subjectA.id}/group/${group.id}/students`).set('Authorization', auth).expect(200);
      await http().get(`/api/grades/subject/${subjectB.id}/group/${group.id}/students`).set('Authorization', auth).expect(403);
    });
  });
});
