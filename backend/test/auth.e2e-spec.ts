import * as request from 'supertest';
import { Role } from '@prisma/client';
import { createTestApp, resetDb, TestApp } from './helpers/app';
import { createUser, DEFAULT_PASSWORD } from './helpers/factories';
import { getCookieValue, getSetCookie } from './helpers/http';

describe('Auth (e2e)', () => {
  let ctx: TestApp;
  const http = () => request(ctx.app.getHttpServer());

  const login = (email: string, password = DEFAULT_PASSWORD) =>
    http().post('/api/auth/login').send({ email, password });

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  beforeEach(async () => {
    await resetDb(ctx.prisma, ctx.cache);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  describe('POST /api/auth/login', () => {
    it('returns the user and an access token, never the refresh token', async () => {
      const user = await createUser(ctx.prisma, { role: Role.TEACHER });

      const res = await login(user.email).expect(200);

      expect(res.body.user).toEqual({ id: user.id, email: user.email, role: 'TEACHER' });
      expect(typeof res.body.accessToken).toBe('string');
      expect(res.body).not.toHaveProperty('refreshToken');
    });

    it('sets the refresh token as an httpOnly cookie and the role as a readable one', async () => {
      const user = await createUser(ctx.prisma);

      const res = await login(user.email).expect(200);

      expect(getSetCookie(res, 'refreshToken')).toMatch(/HttpOnly/i);
      expect(getSetCookie(res, 'refreshToken')).toMatch(/SameSite=Strict/i);
      expect(getSetCookie(res, 'userRole')).not.toMatch(/HttpOnly/i);
      expect(getCookieValue(res, 'userRole')).toBe('STUDENT');
    });

    it('stores only a hash of the refresh token in the database', async () => {
      const user = await createUser(ctx.prisma);

      const res = await login(user.email).expect(200);

      const stored = await ctx.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
      expect(stored.refreshToken).toBeTruthy();
      expect(stored.refreshToken).not.toBe(getCookieValue(res, 'refreshToken'));
    });

    it('answers a wrong password and an unknown email identically (no user enumeration)', async () => {
      const user = await createUser(ctx.prisma);

      const wrongPassword = await login(user.email, 'wrong-password').expect(401);
      const unknownEmail = await login('nobody@mitso.by').expect(401);

      expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
    });

    it.each([
      ['a malformed email', { email: 'not-an-email', password: DEFAULT_PASSWORD }],
      ['a too short password', { email: 'a@mitso.by', password: '123' }],
      ['an unexpected field', { email: 'a@mitso.by', password: DEFAULT_PASSWORD, role: 'ADMIN' }],
    ])('rejects %s with 400', async (_name, body) => {
      await http().post('/api/auth/login').send(body).expect(400);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('rejects a request without the cookie', async () => {
      await http().post('/api/auth/refresh').expect(401);
    });

    it('rejects a forged token', async () => {
      await http()
        .post('/api/auth/refresh')
        .set('Cookie', ['refreshToken=not.a.jwt'])
        .expect(401);
    });

    it('issues a new access token that works on protected routes', async () => {
      const user = await createUser(ctx.prisma);
      const loginRes = await login(user.email).expect(200);

      const refreshRes = await http()
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${getCookieValue(loginRes, 'refreshToken')}`])
        .expect(200);

      const me = await http()
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${refreshRes.body.accessToken}`)
        .expect(200);
      expect(me.body.email).toBe(user.email);
      expect(getSetCookie(refreshRes, 'refreshToken')).toBeDefined();
    });

    it('rejects the previous refresh token after it has been rotated', async () => {
      const user = await createUser(ctx.prisma);
      const loginRes = await login(user.email).expect(200);
      const oldToken = getCookieValue(loginRes, 'refreshToken');

      // Move the clock so the new token really differs (JWT `iat` has 1 second resolution)
      const realNow = Date.now();
      const spy = jest.spyOn(Date, 'now').mockReturnValue(realNow + 5000);
      await http().post('/api/auth/refresh').set('Cookie', [`refreshToken=${oldToken}`]).expect(200);
      spy.mockRestore();

      await http().post('/api/auth/refresh').set('Cookie', [`refreshToken=${oldToken}`]).expect(401);
    });

    it('rejects the refresh token after logout', async () => {
      const user = await createUser(ctx.prisma);
      const loginRes = await login(user.email).expect(200);
      const refreshCookie = `refreshToken=${getCookieValue(loginRes, 'refreshToken')}`;

      await http()
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
        .expect(200);

      await http().post('/api/auth/refresh').set('Cookie', [refreshCookie]).expect(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('rejects requests without a token', async () => {
      await http().get('/api/auth/me').expect(401);
    });

    it('rejects a garbage token', async () => {
      await http().get('/api/auth/me').set('Authorization', 'Bearer garbage').expect(401);
    });

    it('returns the profile of the token owner', async () => {
      const user = await createUser(ctx.prisma, { role: Role.ADMIN });
      const loginRes = await login(user.email).expect(200);

      const res = await http()
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
        .expect(200);

      expect(res.body).toMatchObject({ id: user.id, role: 'ADMIN', student: null, teacher: null });
    });

    it('rejects a valid token whose user was deleted', async () => {
      const user = await createUser(ctx.prisma);
      const loginRes = await login(user.email).expect(200);
      await ctx.prisma.user.delete({ where: { id: user.id } });

      await http()
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
        .expect(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('requires authentication', async () => {
      await http().post('/api/auth/logout').expect(401);
    });

    it('wipes the stored refresh token and clears the cookies', async () => {
      const user = await createUser(ctx.prisma);
      const loginRes = await login(user.email).expect(200);

      const res = await http()
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
        .expect(200);

      const stored = await ctx.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
      expect(stored.refreshToken).toBeNull();
      expect(getCookieValue(res, 'refreshToken')).toBe('');
    });
  });
});
