import * as request from 'supertest';
import { Role } from '@prisma/client';
import { createTestApp, resetDb, TestApp } from './helpers/app';
import { bearerFor } from './helpers/auth';
import { createGrade, createStudent, createSubject, createTeacher, createUser, DEFAULT_PASSWORD } from './helpers/factories';

/**
 * Deleting a profile must end the person's access at once, even with the auth cache warm.
 * These tests cover the two cache-related risks: an access token that is still valid (15 min)
 * and the cached user row (30 s) must both stop working the moment the account is deleted.
 */
describe('Account deletion (e2e)', () => {
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

  const login = (email: string) => http().post('/api/auth/login').send({ email, password: DEFAULT_PASSWORD });

  it('a deleted student loses access immediately, with their cached user row and valid token', async () => {
    const admin = await createUser(ctx.prisma, { role: Role.ADMIN });
    const { user, student } = await createStudent(ctx.prisma);
    const studentAuth = await bearerFor(ctx.app, user);
    await http().get('/api/auth/me').set('Authorization', studentAuth).expect(200); // warms the cache

    await http().delete(`/api/students/${student.id}`).set('Authorization', await bearerFor(ctx.app, admin)).expect(200);

    await http().get('/api/auth/me').set('Authorization', studentAuth).expect(401);
    await login(user.email).expect(401);
    expect(await ctx.prisma.user.findUnique({ where: { id: user.id } })).toBeNull();
    expect(await ctx.prisma.refreshSession.count({ where: { userId: user.id } })).toBe(0);
  });

  it('a deleted student cannot refresh a session: refresh sessions go with the account', async () => {
    const admin = await createUser(ctx.prisma, { role: Role.ADMIN });
    const { user, student } = await createStudent(ctx.prisma);
    const loginRes = await login(user.email).expect(200);
    const refreshCookie = (loginRes.headers['set-cookie'] as unknown as string[]).find((c) => c.startsWith('refreshToken='));
    expect(refreshCookie).toBeDefined();
    expect(await ctx.prisma.refreshSession.count({ where: { userId: user.id } })).toBe(1);

    await http().delete(`/api/students/${student.id}`).set('Authorization', await bearerFor(ctx.app, admin)).expect(200);

    expect(await ctx.prisma.refreshSession.count({ where: { userId: user.id } })).toBe(0);
    await http().post('/api/auth/refresh').set('Cookie', refreshCookie as string).expect(401);
  });

  it('deleting a student also removes their grades', async () => {
    const admin = await createUser(ctx.prisma, { role: Role.ADMIN });
    const { student } = await createStudent(ctx.prisma);
    const subject = await createSubject(ctx.prisma);
    await createGrade(ctx.prisma, { studentId: student.id, subjectId: subject.id });

    await http().delete(`/api/students/${student.id}`).set('Authorization', await bearerFor(ctx.app, admin)).expect(200);

    expect(await ctx.prisma.grade.count()).toBe(0);
  });

  it('a deleted teacher loses access immediately', async () => {
    const admin = await createUser(ctx.prisma, { role: Role.ADMIN });
    const { user, teacher } = await createTeacher(ctx.prisma);
    const teacherAuth = await bearerFor(ctx.app, user);
    await http().get('/api/auth/me').set('Authorization', teacherAuth).expect(200);

    await http().delete(`/api/teachers/${teacher.id}`).set('Authorization', await bearerFor(ctx.app, admin)).expect(200);

    await http().get('/api/auth/me').set('Authorization', teacherAuth).expect(401);
    await login(user.email).expect(401);
  });

  it('a student created through the API can use the system straight away (a missing user is never cached)', async () => {
    const admin = await createUser(ctx.prisma, { role: Role.ADMIN });
    const adminAuth = await bearerFor(ctx.app, admin);

    const created = await http()
      .post('/api/students')
      .set('Authorization', adminAuth)
      .send({
        email: 'fresh@mitso.by',
        password: DEFAULT_PASSWORD,
        firstName: 'Новый',
        lastName: 'Студент',
        studentId: 'NEW-1',
        course: 1,
        enrollmentYear: 2025,
      })
      .expect(201);

    const session = await login('fresh@mitso.by').expect(200);
    await http().get('/api/auth/me').set('Authorization', `Bearer ${session.body.accessToken}`).expect(200);
    expect(created.body.id).toBeDefined();
  });
});
