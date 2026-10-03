import * as request from 'supertest';
import { Role } from '@prisma/client';
import { createTestApp, resetDb, TestApp } from './helpers/app';
import { bearerFor } from './helpers/auth';
import {
  assignTeacher,
  createGroup,
  createStudent,
  createSubject,
  createTeacher,
  createUser,
} from './helpers/factories';

type Who = 'anon' | 'student' | 'teacher' | 'admin';
const ALL: Who[] = ['anon', 'student', 'teacher', 'admin'];

/**
 * Access matrix: endpoint x role. One place that answers "who may read what",
 * so a forgotten @Roles() shows up as a red row, not as a data leak in production.
 */
describe('Access matrix (e2e)', () => {
  let ctx: TestApp;
  let ids: { student: number; teacher: number; subject: number; group: number };
  const tokens: Record<Who, string | null> = { anon: null, student: null, teacher: null, admin: null };

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  beforeEach(async () => {
    await resetDb(ctx.prisma, ctx.cache);
    const group = await createGroup(ctx.prisma);
    const subject = await createSubject(ctx.prisma);
    const s = await createStudent(ctx.prisma, { groupId: group.id });
    const t = await createTeacher(ctx.prisma);
    await assignTeacher(ctx.prisma, t.teacher.id, subject.id);
    const admin = await createUser(ctx.prisma, { role: Role.ADMIN });

    ids = { student: s.student.id, teacher: t.teacher.id, subject: subject.id, group: group.id };
    tokens.student = await bearerFor(ctx.app, s.user);
    tokens.teacher = await bearerFor(ctx.app, t.user);
    tokens.admin = await bearerFor(ctx.app, admin);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  /** Who gets through (200). Everyone else: anon -> 401, logged in but wrong role -> 403. */
  const matrix: Array<[string, (i: typeof ids) => string, Who[]]> = [
    // people lists: staff only
    ['GET /students', () => '/api/students', ['teacher', 'admin']],
    ['GET /teachers', () => '/api/teachers', ['teacher', 'admin']],
    ['GET /teachers/:id', (i) => `/api/teachers/${i.teacher}`, ['teacher', 'admin']],
    ['GET /teachers/:id/subjects', (i) => `/api/teachers/${i.teacher}/subjects`, ['teacher', 'admin']],
    ['GET /groups/:id', (i) => `/api/groups/${i.group}`, ['teacher', 'admin']],
    ['GET /subjects/:id/teachers', (i) => `/api/subjects/${i.subject}/teachers`, ['teacher', 'admin']],
    // reference data: any logged-in user
    ['GET /groups', () => '/api/groups', ['student', 'teacher', 'admin']],
    ['GET /subjects', () => '/api/subjects', ['student', 'teacher', 'admin']],
    ['GET /subjects/:id', (i) => `/api/subjects/${i.subject}`, ['student', 'teacher', 'admin']],
    ['GET /faculties', () => '/api/faculties', ['student', 'teacher', 'admin']],
    ['GET /specializations', () => '/api/specializations', ['student', 'teacher', 'admin']],
    ['GET /auth/me', () => '/api/auth/me', ['student', 'teacher', 'admin']],
  ];

  describe.each(matrix)('%s', (_name, path, allowed) => {
    it.each(ALL)('as %s', async (who) => {
      const req = request(ctx.app.getHttpServer()).get(path(ids));
      if (tokens[who]) req.set('Authorization', tokens[who] as string);
      const expected = allowed.includes(who) ? 200 : who === 'anon' ? 401 : 403;
      await req.expect(expected);
    });
  });

  it('GET /students/:id: a student sees only their own record', async () => {
    const other = await createStudent(ctx.prisma);
    const get = (id: number, who: Who) =>
      request(ctx.app.getHttpServer()).get(`/api/students/${id}`).set('Authorization', tokens[who] as string);

    await get(ids.student, 'student').expect(200);
    await get(other.student.id, 'student').expect(403);
    await get(other.student.id, 'teacher').expect(200);
    await get(other.student.id, 'admin').expect(200);
  });

  describe('writes are admin-only', () => {
    const writes: Array<[string, 'post' | 'patch' | 'delete', (i: typeof ids) => string]> = [
      ['POST /groups', 'post', () => '/api/groups'],
      ['POST /subjects', 'post', () => '/api/subjects'],
      ['POST /students', 'post', () => '/api/students'],
      ['POST /teachers', 'post', () => '/api/teachers'],
      ['PATCH /students/:id', 'patch', (i) => `/api/students/${i.student}`],
      ['DELETE /teachers/:id', 'delete', (i) => `/api/teachers/${i.teacher}`],
      ['DELETE /subjects/:id', 'delete', (i) => `/api/subjects/${i.subject}`],
    ];

    it.each(writes)('%s rejects anon/student/teacher before touching data', async (_n, method, path) => {
      for (const who of ['anon', 'student', 'teacher'] as Who[]) {
        const req = request(ctx.app.getHttpServer())[method](path(ids)).send({});
        if (tokens[who]) req.set('Authorization', tokens[who] as string);
        await req.expect(who === 'anon' ? 401 : 403);
      }
    });
  });
});
