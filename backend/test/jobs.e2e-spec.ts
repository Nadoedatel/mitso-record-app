import * as request from 'supertest';
import { Role } from '@prisma/client';
import { createTestApp, resetDb, TestApp } from './helpers/app';
import { bearerFor } from './helpers/auth';
import { createStudent, createUser } from './helpers/factories';

/** Background jobs need Redis: they run in the redis job of CI (REDIS_URL set) and are skipped otherwise. */
const describeWithRedis = process.env.REDIS_URL ? describe : describe.skip;

interface JobBody {
  id: string;
  state: string;
  result: { created?: number; skipped?: number; failed?: number; errors?: { row: number }[]; fileName?: string } | null;
}

describeWithRedis('Background jobs (e2e)', () => {
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

  /** Polls the job until it leaves waiting/active (the worker runs in the same process) */
  async function untilDone(jobId: string, auth: string): Promise<JobBody> {
    for (let attempt = 0; attempt < 100; attempt++) {
      const res = await http().get(`/api/jobs/${jobId}`).set('Authorization', auth).expect(200);
      if (res.body.state === 'completed' || res.body.state === 'failed') return res.body as JobBody;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(`Job ${jobId} did not finish in time`);
  }

  const HEADER = 'email,password,firstName,lastName,studentId,course,enrollmentYear';
  const upload = (auth: string, csv: string) =>
    http().post('/api/jobs/imports/students').set('Authorization', auth).attach('file', Buffer.from(csv), 'students.csv');

  describe('export of a record book', () => {
    it('lets a student export their own record book and download a real .xlsx', async () => {
      const { user, student } = await createStudent(ctx.prisma);
      const auth = await bearerFor(ctx.app, user);

      const started = await http().post(`/api/jobs/exports/students/${student.id}`).set('Authorization', auth).expect(202);
      const job = await untilDone(started.body.id, auth);

      expect(job.state).toBe('completed');
      expect(job.result?.fileName).toContain('.xlsx');
      const file = await http()
        .get(`/api/jobs/${job.id}/file`)
        .set('Authorization', auth)
        .buffer(true)
        .parse((res, done) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => chunks.push(chunk));
          res.on('end', () => done(null, Buffer.concat(chunks)));
        })
        .expect(200);
      expect(file.headers['content-disposition']).toContain('attachment');
      expect((file.body as Buffer).subarray(0, 2).toString()).toBe('PK'); // xlsx is a zip
    });

    it('forbids a student to export someone else’s record book, and hides the job from other users', async () => {
      const owner = await createStudent(ctx.prisma);
      const other = await createStudent(ctx.prisma);
      const ownerAuth = await bearerFor(ctx.app, owner.user);
      const otherAuth = await bearerFor(ctx.app, other.user);

      await http().post(`/api/jobs/exports/students/${owner.student.id}`).set('Authorization', otherAuth).expect(403);

      const started = await http().post(`/api/jobs/exports/students/${owner.student.id}`).set('Authorization', ownerAuth).expect(202);
      await http().get(`/api/jobs/${started.body.id}`).set('Authorization', otherAuth).expect(404);
    });

    it('answers 404 for a student that does not exist', async () => {
      const admin = await createUser(ctx.prisma, { role: Role.ADMIN });
      await http().post('/api/jobs/exports/students/99999').set('Authorization', await bearerFor(ctx.app, admin)).expect(404);
    });
  });

  describe('import of students from CSV', () => {
    it('creates valid rows, reports bad ones with their line, and is safe to run again', async () => {
      const admin = await createUser(ctx.prisma, { role: Role.ADMIN });
      const auth = await bearerFor(ctx.app, admin);
      const csv = [
        HEADER,
        'one@mitso.by,password123,Иван,Иванов,CSV1,1,2025',
        'two@mitso.by,password123,Пётр,Петров,CSV2,2,2024',
        'broken,short,Анна,Сидорова,CSV3,abc,2025',
      ].join('\n');

      const first = await untilDone((await upload(auth, csv).expect(202)).body.id, auth);
      expect(first.state).toBe('completed');
      expect(first.result).toMatchObject({ created: 2, skipped: 0, failed: 1 });
      expect(first.result?.errors?.[0].row).toBe(4);
      expect(await ctx.prisma.student.count()).toBe(2);

      const second = await untilDone((await upload(auth, csv).expect(202)).body.id, auth);
      expect(second.result).toMatchObject({ created: 0, skipped: 2, failed: 1 });
      expect(await ctx.prisma.student.count()).toBe(2);
    });

    it('rejects a file with wrong columns at once (400), without creating a job', async () => {
      const admin = await createUser(ctx.prisma, { role: Role.ADMIN });
      const res = await upload(await bearerFor(ctx.app, admin), 'email,color\na@mitso.by,red').expect(400);
      expect(res.body.message).toContain('Неизвестные колонки');
    });

    it('is for ADMIN only', async () => {
      const { user } = await createStudent(ctx.prisma);
      await upload(await bearerFor(ctx.app, user), `${HEADER}\na@mitso.by,password123,А,Б,X1,1,2025`).expect(403);
    });

    it('asks for a file when none is attached', async () => {
      const admin = await createUser(ctx.prisma, { role: Role.ADMIN });
      await http().post('/api/jobs/imports/students').set('Authorization', await bearerFor(ctx.app, admin)).expect(400);
    });
  });
});
