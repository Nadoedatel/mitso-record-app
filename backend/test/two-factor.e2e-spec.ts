import * as request from 'supertest';
import { Role } from '@prisma/client';
import { createTestApp, resetDb, TestApp } from './helpers/app';
import { bearerFor } from './helpers/auth';
import { createStudent, createUser, DEFAULT_PASSWORD } from './helpers/factories';
import { getSetCookie } from './helpers/http';
import { generateTotp } from '../src/auth/two-factor/totp';

/** Second login factor (authenticator app) for ADMIN: setup, login in two steps, recovery codes, replay and lockout. */
describe('Two-factor login (e2e)', () => {
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

  const codeIn = (secret: string, windows = 0) => generateTotp(secret, Date.now() + windows * 30_000);
  const login = (email: string) => http().post('/api/auth/login').send({ email, password: DEFAULT_PASSWORD });

  /** An admin that went through the whole setup. `windows` is the offset the first code was taken from. */
  async function adminWithTwoFactor() {
    const admin = await createUser(ctx.prisma, { role: Role.ADMIN });
    const auth = await bearerFor(ctx.app, admin);
    const setup = await http().post('/api/auth/2fa/setup').set('Authorization', auth).expect(200);
    const enable = await http()
      .post('/api/auth/2fa/enable')
      .set('Authorization', auth)
      .send({ code: codeIn(setup.body.secret, -1) })
      .expect(200);
    return { admin, auth, secret: setup.body.secret as string, recoveryCodes: enable.body.recoveryCodes as string[] };
  }

  describe('setup', () => {
    it('gives the secret and a QR code, and keeps login as it was until a code is confirmed', async () => {
      const admin = await createUser(ctx.prisma, { role: Role.ADMIN });
      const auth = await bearerFor(ctx.app, admin);

      const res = await http().post('/api/auth/2fa/setup').set('Authorization', auth).expect(200);

      expect(res.body.secret).toMatch(/^[A-Z2-7]{32}$/);
      expect(res.body.qrCode).toMatch(/^data:image\/png;base64,/);
      expect((await login(admin.email).expect(200)).body.accessToken).toBeDefined(); // not enabled yet
      const stored = await ctx.prisma.user.findUniqueOrThrow({ where: { id: admin.id } });
      expect(stored.totpSecret).not.toContain(res.body.secret); // encrypted at rest
      expect(stored.totpEnabledAt).toBeNull();
    });

    it('is for ADMIN only', async () => {
      const { user } = await createStudent(ctx.prisma);
      await http().post('/api/auth/2fa/setup').set('Authorization', await bearerFor(ctx.app, user)).expect(403);
      await http().post('/api/auth/2fa/setup').expect(401);
    });

    it('does not enable with a wrong code, and does with the right one (ten recovery codes, once)', async () => {
      const admin = await createUser(ctx.prisma, { role: Role.ADMIN });
      const auth = await bearerFor(ctx.app, admin);
      const { body } = await http().post('/api/auth/2fa/setup').set('Authorization', auth).expect(200);

      await http().post('/api/auth/2fa/enable').set('Authorization', auth).send({ code: '000000' }).expect(400);
      const ok = await http().post('/api/auth/2fa/enable').set('Authorization', auth).send({ code: codeIn(body.secret) }).expect(200);

      expect(ok.body.recoveryCodes).toHaveLength(10);
      expect((await http().get('/api/auth/me').set('Authorization', auth)).body.twoFactorEnabled).toBe(true);
      await http().post('/api/auth/2fa/setup').set('Authorization', auth).expect(409); // already on
    });

    it('rejects a malformed code before touching anything (400)', async () => {
      const admin = await createUser(ctx.prisma, { role: Role.ADMIN });
      await http().post('/api/auth/2fa/enable').set('Authorization', await bearerFor(ctx.app, admin)).send({ code: 'abc' }).expect(400);
    });
  });

  describe('login with the factor on', () => {
    it('the password step gives only a challenge: no tokens, no cookie', async () => {
      const { admin } = await adminWithTwoFactor();

      const res = await login(admin.email).expect(200);

      expect(res.body).toMatchObject({ twoFactorRequired: true, challengeToken: expect.any(String) });
      expect(res.body.accessToken).toBeUndefined();
      expect(getSetCookie(res, 'refreshToken')).toBeUndefined();
    });

    it('a code trades the challenge for a normal session; the same code cannot be used twice', async () => {
      const { admin, secret } = await adminWithTwoFactor();
      const { challengeToken } = (await login(admin.email)).body;
      const code = codeIn(secret, 1); // the window after the one that enabled it

      const verified = await http().post('/api/auth/2fa/verify').send({ challengeToken, code }).expect(200);
      expect(verified.body).toMatchObject({ user: { email: admin.email, role: 'ADMIN' }, accessToken: expect.any(String) });
      expect(getSetCookie(verified, 'refreshToken')).toBeDefined();
      await http().get('/api/auth/me').set('Authorization', `Bearer ${verified.body.accessToken}`).expect(200);

      const again = (await login(admin.email)).body.challengeToken;
      await http().post('/api/auth/2fa/verify').send({ challengeToken: again, code }).expect(401); // replay
    });

    it('a recovery code works once', async () => {
      const { admin, recoveryCodes } = await adminWithTwoFactor();

      const first = (await login(admin.email)).body.challengeToken;
      await http().post('/api/auth/2fa/verify').send({ challengeToken: first, code: recoveryCodes[0].toUpperCase() }).expect(200);

      const second = (await login(admin.email)).body.challengeToken;
      await http().post('/api/auth/2fa/verify').send({ challengeToken: second, code: recoveryCodes[0] }).expect(401);
      await http().post('/api/auth/2fa/verify').send({ challengeToken: second, code: recoveryCodes[1] }).expect(200);
    });

    it('a challenge token is not an access token', async () => {
      const { admin } = await adminWithTwoFactor();
      const { challengeToken } = (await login(admin.email)).body;

      await http().get('/api/auth/me').set('Authorization', `Bearer ${challengeToken}`).expect(401);
    });

    it('wrong codes lock the account after five tries, even the right code is refused then', async () => {
      const { admin, secret } = await adminWithTwoFactor();
      const { challengeToken } = (await login(admin.email)).body;

      for (let i = 0; i < 5; i++) {
        await http().post('/api/auth/2fa/verify').send({ challengeToken, code: '000000' }).expect(401);
      }
      await http().post('/api/auth/2fa/verify').send({ challengeToken, code: codeIn(secret, 1) }).expect(429);
    });

    it('rejects a garbage challenge', async () => {
      await http().post('/api/auth/2fa/verify').send({ challengeToken: 'nonsense', code: '123456' }).expect(401);
    });
  });

  describe('disable', () => {
    it('needs the password and a code; afterwards login is one step again', async () => {
      const { admin, auth, secret } = await adminWithTwoFactor();
      const code = codeIn(secret, 1);

      await http().post('/api/auth/2fa/disable').set('Authorization', auth).send({ password: 'wrong-password', code }).expect(400);
      await http().post('/api/auth/2fa/disable').set('Authorization', auth).send({ password: DEFAULT_PASSWORD, code: '000000' }).expect(401);
      await http().post('/api/auth/2fa/disable').set('Authorization', auth).send({ password: DEFAULT_PASSWORD, code }).expect(200);

      expect((await login(admin.email).expect(200)).body.accessToken).toBeDefined();
      expect(await ctx.prisma.recoveryCode.count()).toBe(0);
      const stored = await ctx.prisma.user.findUniqueOrThrow({ where: { id: admin.id } });
      expect(stored).toMatchObject({ totpSecret: null, totpEnabledAt: null });
    });
  });
});
