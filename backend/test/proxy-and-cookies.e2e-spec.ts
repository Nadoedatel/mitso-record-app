import { Controller, Get, Req } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Request } from 'express';
import * as request from 'supertest';
import { configureApp } from '../src/app.setup';
import { createTestApp, resetDb, TestApp } from './helpers/app';
import { createUser, DEFAULT_PASSWORD } from './helpers/factories';
import { bearerFor } from './helpers/auth';
import { getAllSetCookies, getCookieValue } from './helpers/http';

@Controller('whoami')
class WhoAmIController {
  @Get()
  ip(@Req() req: Request) {
    return { ip: req.ip };
  }
}

describe('trust proxy (e2e)', () => {
  async function ipSeenBy(trustProxy: string | undefined, forwarded: string) {
    const prev = process.env.TRUST_PROXY;
    if (trustProxy === undefined) delete process.env.TRUST_PROXY;
    else process.env.TRUST_PROXY = trustProxy;
    const moduleRef = await Test.createTestingModule({ controllers: [WhoAmIController] }).compile();
    const app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    try {
      const res = await request(app.getHttpServer()).get('/api/whoami').set('X-Forwarded-For', forwarded);
      return res.body.ip as string;
    } finally {
      await app.close();
      if (prev === undefined) delete process.env.TRUST_PROXY;
      else process.env.TRUST_PROXY = prev;
    }
  }

  it('ignores X-Forwarded-For by default (a client cannot fake its IP)', async () => {
    expect(await ipSeenBy(undefined, '6.6.6.6')).not.toContain('6.6.6.6');
  });

  it('with TRUST_PROXY=1 takes the address the proxy appended (the last hop)', async () => {
    expect(await ipSeenBy('1', '6.6.6.6, 203.0.113.7')).toBe('203.0.113.7');
  });
});

describe('refresh cookie and Origin check (e2e)', () => {
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

  const loginCookies = async () => {
    const user = await createUser(ctx.prisma);
    const res = await http().post('/api/auth/login').send({ email: user.email, password: DEFAULT_PASSWORD }).expect(200);
    return { user, cookies: getAllSetCookies(res), refresh: getCookieValue(res, 'refreshToken') as string };
  };

  it('scopes the refresh cookie to /api/auth', async () => {
    const { cookies } = await loginCookies();
    const refreshCookie = cookies.find((c) => c.startsWith('refreshToken=') && !c.startsWith('refreshToken=;'));
    expect(refreshCookie).toMatch(/Path=\/api\/auth/);
    expect(refreshCookie).toMatch(/HttpOnly/);
    expect(refreshCookie).toMatch(/SameSite=Strict/);
  });

  it('also expires a legacy refresh cookie that lived on /', async () => {
    const { cookies } = await loginCookies();
    expect(cookies.some((c) => /^refreshToken=;.*Path=\/(;|$)/.test(c))).toBe(true);
  });

  it('refuses refresh from a foreign Origin', async () => {
    const { refresh } = await loginCookies();
    await http().post('/api/auth/refresh').set('Origin', 'https://evil.example').set('Cookie', `refreshToken=${refresh}`).expect(403);
  });

  it('accepts refresh from the frontend Origin and without Origin', async () => {
    const { refresh } = await loginCookies();
    const res = await http().post('/api/auth/refresh').set('Origin', 'http://localhost:3000').set('Cookie', `refreshToken=${refresh}`).expect(200);
    const next = getCookieValue(res, 'refreshToken') as string;
    await http().post('/api/auth/refresh').set('Cookie', `refreshToken=${next}`).expect(200);
  });

  it('refuses logout from a foreign Origin and leaves the session alive', async () => {
    const { user } = await loginCookies();
    const auth = await bearerFor(ctx.app, user);
    await http().post('/api/auth/logout').set('Authorization', auth).set('Origin', 'https://evil.example').expect(403);
    await http().get('/api/auth/me').set('Authorization', auth).expect(200);
  });
});
