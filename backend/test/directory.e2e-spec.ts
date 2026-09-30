import * as request from 'supertest';
import { Role } from '@prisma/client';
import { createTestApp, resetDb, TestApp } from './helpers/app';
import { bearerFor } from './helpers/auth';
import { createGrade, createGroup, createStudent, createSubject, createUser } from './helpers/factories';

/** Reference-data list endpoints return what the screens read, and no more. */
describe('Directory endpoints (e2e)', () => {
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

  it('GET /api/groups gives every group a studentCount (the admin table shows it) and not the student list', async () => {
    const admin = await createUser(ctx.prisma, { role: Role.ADMIN });
    const big = await createGroup(ctx.prisma);
    const empty = await createGroup(ctx.prisma);
    await createStudent(ctx.prisma, { groupId: big.id });
    await createStudent(ctx.prisma, { groupId: big.id });
    await createStudent(ctx.prisma, { groupId: big.id });

    const res = await http().get('/api/groups').set('Authorization', await bearerFor(ctx.app, admin)).expect(200);

    const byId = Object.fromEntries(res.body.data.map((g: { id: number; studentCount: number }) => [g.id, g]));
    expect(byId[big.id].studentCount).toBe(3);
    expect(byId[empty.id].studentCount).toBe(0);
    expect(byId[big.id]).not.toHaveProperty('students');
    expect(byId[big.id]).not.toHaveProperty('_count');
  });

  it('GET /api/subjects/:id does not drag every grade of the subject along', async () => {
    const admin = await createUser(ctx.prisma, { role: Role.ADMIN });
    const subject = await createSubject(ctx.prisma);
    const { student } = await createStudent(ctx.prisma);
    await createGrade(ctx.prisma, { studentId: student.id, subjectId: subject.id });

    const res = await http().get(`/api/subjects/${subject.id}`).set('Authorization', await bearerFor(ctx.app, admin)).expect(200);

    expect(res.body).toMatchObject({ id: subject.id });
    expect(res.body).not.toHaveProperty('grades');
    expect(res.body).toHaveProperty('teacherSubjects');
    expect(res.body).toHaveProperty('subjectGroups');
  });
});
