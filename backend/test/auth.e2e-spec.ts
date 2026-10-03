import * as request from 'supertest';
import { Role } from '@prisma/client';
import { createTestApp, resetDb, TestApp } from './helpers/app';
import { createUser, DEFAULT_PASSWORD } from './helpers/factories';
import * as jwt from 'jsonwebtoken';
import { bearerFor } from './helpers/auth';
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

    it('sets the refresh token as an httpOnly cookie and does not mirror the role into any cookie', async () => {
      const user = await createUser(ctx.prisma);

      const res = await login(user.email).expect(200);

      expect(getSetCookie(res, 'refreshToken')).toMatch(/HttpOnly/i);
      expect(getSetCookie(res, 'refreshToken')).toMatch(/SameSite=Strict/i);
      expect(getCookieValue(res, 'userRole')).toBe(''); // only an expiry of the legacy cookie, never a role value
    });

    it('stores only a hash of the refresh token in the database', async () => {
      const user = await createUser(ctx.prisma);

      const res = await login(user.email).expect(200);

      const sessions = await ctx.prisma.refreshSession.findMany({ where: { userId: user.id } });
      expect(sessions).toHaveLength(1);
      expect(sessions[0].tokenHash).not.toBe(getCookieValue(res, 'refreshToken'));
    });

    it('answers a wrong password and an unknown email identically (no user enumeration)', async () => {
      const user = await createUser(ctx.prisma);

      const wrongPassword = await login(user.email, 'wrong-password').expect(401);
      const unknownEmail = await login('nobody@mitso.by').expect(401);

      expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
    });

    it('locks the email after 5 wrong passwords, even for the right password, and unlocks on success elsewhere', async () => {
      const user = await createUser(ctx.prisma);

      for (let i = 0; i < 5; i++) await login(user.email, 'wrong-password').expect(401);

      await login(user.email).expect(429);
      await login('other-user@mitso.by', 'wrong-password').expect(401);
    });

    it('locks an unknown email the same way (the lock does not reveal which accounts exist)', async () => {
      for (let i = 0; i < 5; i++) await login('ghost@mitso.by', 'wrong-password').expect(401);

      await login('ghost@mitso.by', 'wrong-password').expect(429);
    });

    it('a successful login resets the failure counter', async () => {
      const user = await createUser(ctx.prisma);

      for (let i = 0; i < 4; i++) await login(user.email, 'wrong-password').expect(401);
      await login(user.email).expect(200);
      for (let i = 0; i < 4; i++) await login(user.email, 'wrong-password').expect(401);

      await login(user.email).expect(200);
    });

    it.each([
      ['a malformed email', { email: 'not-an-email', password: DEFAULT_PASSWORD }],
      ['an empty password', { email: 'a@mitso.by', password: '' }],
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

    const refreshWith = (token: string) =>
      http().post('/api/auth/refresh').set('Cookie', [`refreshToken=${token}`]);
    const afterGrace = () => jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 60_000);

    it('keeps two devices logged in independently', async () => {
      const user = await createUser(ctx.prisma);
      const phone = getCookieValue(await login(user.email).expect(200), 'refreshToken') as string;
      const laptop = getCookieValue(await login(user.email).expect(200), 'refreshToken') as string;

      await refreshWith(phone).expect(200);
      await refreshWith(laptop).expect(200);
    });

    it('revokes the whole family when a used token is replayed after the grace window', async () => {
      const user = await createUser(ctx.prisma);
      const stolen = getCookieValue(await login(user.email).expect(200), 'refreshToken') as string;
      const rotated = await refreshWith(stolen).expect(200);
      const legit = getCookieValue(rotated, 'refreshToken') as string;

      const spy = afterGrace();
      await refreshWith(stolen).expect(401);
      spy.mockRestore();

      // the legitimate newest token of that device is dead too
      await refreshWith(legit).expect(401);
      expect(await ctx.prisma.refreshSession.count({ where: { userId: user.id } })).toBe(0);
    });

    it('does not revoke other devices when one family is revoked', async () => {
      const user = await createUser(ctx.prisma);
      const phone = getCookieValue(await login(user.email).expect(200), 'refreshToken') as string;
      const laptop = getCookieValue(await login(user.email).expect(200), 'refreshToken') as string;
      await refreshWith(phone).expect(200);

      const spy = afterGrace();
      await refreshWith(phone).expect(401);
      spy.mockRestore();

      await refreshWith(laptop).expect(200);
    });

    it('treats an immediate replay (two tabs racing) as a plain 401 without revoking the family', async () => {
      const user = await createUser(ctx.prisma);
      const first = getCookieValue(await login(user.email).expect(200), 'refreshToken') as string;
      const rotated = await refreshWith(first).expect(200);

      await refreshWith(first).expect(401);
      await refreshWith(getCookieValue(rotated, 'refreshToken') as string).expect(200);
    });

    it('logout revokes only the calling device', async () => {
      const user = await createUser(ctx.prisma);
      const phoneLogin = await login(user.email).expect(200);
      const laptop = getCookieValue(await login(user.email).expect(200), 'refreshToken') as string;

      await http()
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${phoneLogin.body.accessToken}`)
        .set('Cookie', [`refreshToken=${getCookieValue(phoneLogin, 'refreshToken')}`])
        .expect(200);

      await refreshWith(getCookieValue(phoneLogin, 'refreshToken') as string).expect(401);
      await refreshWith(laptop).expect(200);
    });

    it('logout kills the access token of that device at once, not after 15 minutes', async () => {
      const user = await createUser(ctx.prisma);
      const phone = await login(user.email).expect(200);
      const laptop = await login(user.email).expect(200);
      const me = (accessToken: string) => http().get('/api/auth/me').set('Authorization', `Bearer ${accessToken}`);
      await me(phone.body.accessToken).expect(200);

      await http()
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${phone.body.accessToken}`)
        .set('Cookie', [`refreshToken=${getCookieValue(phone, 'refreshToken')}`])
        .expect(200);

      await me(phone.body.accessToken).expect(401);
      await me(laptop.body.accessToken).expect(200);
    });

    it('a detected token theft also kills the access tokens of that login', async () => {
      const user = await createUser(ctx.prisma);
      const first = await login(user.email).expect(200);
      const stolen = getCookieValue(first, 'refreshToken') as string;
      const rotated = await refreshWith(stolen).expect(200);

      const spy = afterGrace();
      await refreshWith(stolen).expect(401);
      spy.mockRestore();

      await http().get('/api/auth/me').set('Authorization', `Bearer ${rotated.body.accessToken}`).expect(401);
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

    it('wipes the stored refresh sessions and clears the cookies', async () => {
      const user = await createUser(ctx.prisma);
      const loginRes = await login(user.email).expect(200);

      const res = await http()
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
        .expect(200);

      expect(await ctx.prisma.refreshSession.count({ where: { userId: user.id } })).toBe(0);
      expect(getCookieValue(res, 'refreshToken')).toBe('');
    });
  });

  describe('POST /api/auth/change-password', () => {
    const change = (accessToken: string, body: object) =>
      http().post('/api/auth/change-password').set('Authorization', `Bearer ${accessToken}`).send(body);

    it('requires authentication', async () => {
      await http().post('/api/auth/change-password').send({ currentPassword: 'a', newPassword: 'b'.repeat(8) }).expect(401);
    });

    it('changes the password, revokes every device and lets the user log in with the new one', async () => {
      const user = await createUser(ctx.prisma);
      const phone = await login(user.email).expect(200);
      const laptop = await login(user.email).expect(200);

      await change(phone.body.accessToken, { currentPassword: DEFAULT_PASSWORD, newPassword: 'brand-new-pass' }).expect(200);

      await http().get('/api/auth/me').set('Authorization', `Bearer ${phone.body.accessToken}`).expect(401);
      await http().get('/api/auth/me').set('Authorization', `Bearer ${laptop.body.accessToken}`).expect(401);
      await http()
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${getCookieValue(laptop, 'refreshToken')}`])
        .expect(401);
      await login(user.email).expect(401);
      await login(user.email, 'brand-new-pass').expect(200);
    });

    it('rejects a wrong current password and keeps the old one', async () => {
      const user = await createUser(ctx.prisma);
      const session = await login(user.email).expect(200);

      await change(session.body.accessToken, { currentPassword: 'wrong-password', newPassword: 'brand-new-pass' }).expect(400);

      await login(user.email).expect(200);
    });

    it.each([
      ['a new password shorter than 8', { currentPassword: DEFAULT_PASSWORD, newPassword: '1234567' }],
      ['a new password equal to the current one', { currentPassword: DEFAULT_PASSWORD, newPassword: DEFAULT_PASSWORD }],
      ['an unexpected field', { currentPassword: DEFAULT_PASSWORD, newPassword: 'brand-new-pass', role: 'ADMIN' }],
    ])('rejects %s with 400', async (_name, body) => {
      const user = await createUser(ctx.prisma);
      const session = await login(user.email).expect(200);

      await change(session.body.accessToken, body).expect(400);
    });

    it('counts wrong current passwords toward the login lockout (no guessing oracle for a stolen token)', async () => {
      const user = await createUser(ctx.prisma);
      const session = await login(user.email).expect(200);

      for (let i = 0; i < 4; i++) {
        await change(session.body.accessToken, { currentPassword: `wrong-${i}`, newPassword: 'brand-new-pass' }).expect(400);
      }
      await change(session.body.accessToken, { currentPassword: 'wrong-4', newPassword: 'brand-new-pass' }).expect(400);

      await change(session.body.accessToken, { currentPassword: DEFAULT_PASSWORD, newPassword: 'brand-new-pass' }).expect(429);
      await login(user.email).expect(429);
    });
  });

  describe('CSRF: cookie and state-changing endpoints refuse foreign browser origins', () => {
    it.each(['/api/auth/refresh', '/api/auth/logout', '/api/auth/change-password'])('%s answers 403 to Origin evil.example', async (path) => {
      const user = await createUser(ctx.prisma);
      const session = await login(user.email).expect(200);

      await http()
        .post(path)
        .set('Origin', 'https://evil.example')
        .set('Authorization', `Bearer ${session.body.accessToken}`)
        .set('Cookie', [`refreshToken=${getCookieValue(session, 'refreshToken')}`])
        .send({ currentPassword: DEFAULT_PASSWORD, newPassword: 'brand-new-pass' })
        .expect(403);

      await http().get('/api/auth/me').set('Authorization', `Bearer ${session.body.accessToken}`).expect(200);
    });
  });

  describe('hardening', () => {
    it('still lets a user with a short legacy password log in (only creation enforces 8+)', async () => {
      const user = await createUser(ctx.prisma, { password: '123456' });
      await login(user.email, '123456').expect(200);
    });

    it('rejects an access token signed with another algorithm or with alg=none', async () => {
      const user = await createUser(ctx.prisma);
      const payload = { sub: user.id, email: user.email, role: user.role };
      const hs512 = jwt.sign(payload, process.env.JWT_ACCESS_SECRET as string, { algorithm: 'HS512' });
      const none = jwt.sign(payload, '', { algorithm: 'none' });

      await http().get('/api/auth/me').set('Authorization', `Bearer ${hs512}`).expect(401);
      await http().get('/api/auth/me').set('Authorization', `Bearer ${none}`).expect(401);
    });

    it('rejects creating an account with a password shorter than 8 characters', async () => {
      const admin = await createUser(ctx.prisma, { role: Role.ADMIN });
      const res = await http()
        .post('/api/teachers')
        .set('Authorization', await bearerFor(ctx.app, admin))
        .send({ email: 'new@mitso.by', password: '1234567', firstName: 'A', lastName: 'B', department: 'IT', position: 'Lecturer' });
      expect(res.status).toBe(400);
    });
  });
});
