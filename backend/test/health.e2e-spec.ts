import * as request from 'supertest';
import { createTestApp, TestApp } from './helpers/app';

describe('GET /api/health (e2e)', () => {
  let ctx: TestApp;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('reports the app and the database as up', async () => {
    const res = await request(ctx.app.getHttpServer()).get('/api/health').expect(200);

    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('up');
  });
});
