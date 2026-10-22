import * as request from 'supertest';
import { createTestApp, resetDb, TestApp } from './helpers/app';
import { bearerFor } from './helpers/auth';
import { createGroup, createStudent } from './helpers/factories';

/** GET /api/metrics: closed by default, a bearer token opens it, and it shows what the app really did. */
describe('Metrics (e2e)', () => {
  let ctx: TestApp;
  const http = () => request(ctx.app.getHttpServer());
  const TOKEN = 'e2e-metrics-token';
  const scrape = (token = TOKEN) => http().get('/api/metrics').set('Authorization', `Bearer ${token}`);

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  beforeEach(async () => {
    delete process.env.METRICS_TOKEN;
    await resetDb(ctx.prisma, ctx.cache);
  });

  afterAll(async () => {
    delete process.env.METRICS_TOKEN;
    await ctx.app.close();
  });

  it('does not exist (404) while METRICS_TOKEN is not set', async () => {
    await http().get('/api/metrics').expect(404);
    await scrape().expect(404);
  });

  describe('with METRICS_TOKEN', () => {
    beforeEach(() => {
      process.env.METRICS_TOKEN = TOKEN;
    });

    it('refuses a missing or wrong token (401)', async () => {
      await http().get('/api/metrics').expect(401);
      await scrape('wrong').expect(401);
    });

    it('answers in the Prometheus text format, with process metrics', async () => {
      const res = await scrape().expect(200);

      expect(res.headers['content-type']).toContain('text/plain');
      expect(res.text).toContain('# TYPE http_requests_total counter');
      expect(res.text).toContain('process_cpu_user_seconds_total');
      expect(res.text).toContain('nodejs_eventloop_lag_seconds');
    });

    it('counts requests by route template and status, also those a guard rejected', async () => {
      const { user, student } = await createStudent(ctx.prisma);
      const auth = await bearerFor(ctx.app, user);
      await http().get(`/api/students/${student.id}`).set('Authorization', auth).expect(200);
      await http().get(`/api/students/${student.id}`).set('Authorization', auth).expect(200);
      await http().get('/api/groups').expect(401); // rejected by the guard, never reaches a handler
      await http().get('/api/no-such-route').expect(404);

      const { text } = await scrape().expect(200);

      expect(text).toMatch(/http_requests_total\{method="GET",route="\/api\/students\/:id",status="200"\} 2/);
      expect(text).toMatch(/http_requests_total\{method="GET",route="\/api\/groups",status="401"\} 1/);
      expect(text).toMatch(/http_requests_total\{method="GET",route="unmatched",status="404"\} 1/);
      expect(text).not.toContain(`/api/students/${student.id}`); // the real url never becomes a label
      expect(text).toContain('http_request_duration_seconds_bucket');
    });

    it('does not count the scrape itself', async () => {
      await scrape().expect(200);
      const { text } = await scrape().expect(200);

      expect(text).not.toContain('route="/api/metrics"');
    });

    it('shows cache hits and misses of reference data', async () => {
      const { user } = await createStudent(ctx.prisma);
      await createGroup(ctx.prisma);
      const auth = await bearerFor(ctx.app, user);
      await http().get('/api/groups').set('Authorization', auth).expect(200); // miss
      await http().get('/api/groups').set('Authorization', auth).expect(200); // hit

      const { text } = await scrape().expect(200);

      expect(text).toMatch(/cache_requests_total\{namespace="directory",result="miss"\} \d+/);
      expect(text).toMatch(/cache_requests_total\{namespace="directory",result="hit"\} \d+/);
    });
  });
});
