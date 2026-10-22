import { JwtService } from '@nestjs/jwt';
import { ConflictError, InvalidInputError, UnauthenticatedError, UnavailableError } from '../../common/errors';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginAttemptsService } from '../login-attempts.service';
import { hashRecoveryCode } from './recovery-codes';
import { generateSecret, generateTotp, timeStep } from './totp';
import { decryptSecret, encryptSecret } from './totp-crypto';
import { TwoFactorService } from './two-factor.service';

describe('TwoFactorService', () => {
  const key = randomBytes(32);
  const prisma = {
    user: { findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    recoveryCode: { deleteMany: jest.fn(), createMany: jest.fn(), updateMany: jest.fn() },
    $transaction: jest.fn(),
  };
  const attempts = { assertNotLocked: jest.fn(), recordFailure: jest.fn(), recordSuccess: jest.fn() };
  const jwt = new JwtService({});
  const service = new TwoFactorService(prisma as unknown as PrismaService, jwt, attempts as unknown as LoginAttemptsService);

  const secret = generateSecret();
  const enabledUser = { id: 1, email: 'admin@mitso.by', password: '', totpSecret: encryptSecret(secret, key), totpEnabledAt: new Date(), totpLastStep: null };

  afterEach(() => jest.restoreAllMocks());

  beforeEach(() => {
    jest.resetAllMocks();
    process.env.JWT_ACCESS_SECRET = 'a'.repeat(40);
    process.env.TOTP_ENCRYPTION_KEY = key.toString('base64');
    prisma.$transaction.mockImplementation(async (operations: Promise<unknown>[]) => Promise.all(operations));
    prisma.user.updateMany.mockResolvedValue({ count: 1 });
    prisma.recoveryCode.updateMany.mockResolvedValue({ count: 1 });
  });

  describe('challenge token', () => {
    it('round-trips the user id', async () => {
      expect(service.verifyChallenge(await service.createChallenge(42))).toBe(42);
    });

    it('is NOT an access token: the access secret does not verify it', async () => {
      const token = await service.createChallenge(42);
      expect(() => jwt.verify(token, { secret: process.env.JWT_ACCESS_SECRET })).toThrow();
    });

    it('does not accept an access token as a challenge', () => {
      const accessToken = jwt.sign({ sub: 1, email: 'a@b.c', role: 'ADMIN' }, { secret: process.env.JWT_ACCESS_SECRET });
      expect(() => service.verifyChallenge(accessToken)).toThrow(UnauthenticatedError);
    });

    it('rejects garbage and an expired token', async () => {
      expect(() => service.verifyChallenge('nonsense')).toThrow(UnauthenticatedError);
      const token = await service.createChallenge(1);
      const now = Date.now();
      const clock = jest.spyOn(Date, 'now').mockReturnValue(now + 6 * 60 * 1000); // the token lives 5 minutes
      expect(() => service.verifyChallenge(token)).toThrow(UnauthenticatedError);
      clock.mockRestore();
    });
  });

  describe('setup', () => {
    it('stores the secret encrypted, leaves the factor off and returns the QR code', async () => {
      prisma.user.findUnique.mockResolvedValue({ totpEnabledAt: null });

      const result = await service.setup(1, 'admin@mitso.by');

      const stored = prisma.user.update.mock.calls[0][0].data;
      expect(stored.totpSecret).not.toContain(result.secret);
      expect(decryptSecret(stored.totpSecret, key)).toBe(result.secret);
      expect(stored).toMatchObject({ totpEnabledAt: null, totpLastStep: null });
      expect(result.qrCode).toMatch(/^data:image\/png;base64,/);
      expect(result.otpauthUri).toContain(result.secret);
    });

    it('refuses when it is already on', async () => {
      prisma.user.findUnique.mockResolvedValue({ totpEnabledAt: new Date() });
      await expect(service.setup(1, 'a@b.c')).rejects.toBeInstanceOf(ConflictError);
    });

    it('answers 503 when the server has no encryption key', async () => {
      delete process.env.TOTP_ENCRYPTION_KEY;
      await expect(service.setup(1, 'a@b.c')).rejects.toBeInstanceOf(UnavailableError);
    });
  });

  describe('enable', () => {
    const pending = { ...enabledUser, totpEnabledAt: null };

    it('turns the factor on with a valid code and returns ten recovery codes, stored only as hashes', async () => {
      prisma.user.findUnique.mockResolvedValue(pending);

      const codes = await service.enable(1, generateTotp(secret));

      expect(codes).toHaveLength(10);
      const stored = prisma.recoveryCode.createMany.mock.calls[0][0].data as { codeHash: string }[];
      expect(stored.map((row) => row.codeHash)).toEqual(codes.map(hashRecoveryCode));
      expect(prisma.user.update.mock.calls[0][0].data).toMatchObject({ totpLastStep: expect.any(Number) });
      expect(prisma.user.update.mock.calls[0][0].data.totpEnabledAt).toBeInstanceOf(Date);
    });

    it('counts a wrong code as a failed attempt and enables nothing', async () => {
      prisma.user.findUnique.mockResolvedValue(pending);

      await expect(service.enable(1, '000000')).rejects.toBeInstanceOf(InvalidInputError);
      expect(attempts.recordFailure).toHaveBeenCalledWith('2fa:1');
      expect(prisma.recoveryCode.createMany).not.toHaveBeenCalled();
    });

    it('needs a started setup', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...pending, totpSecret: null });
      await expect(service.enable(1, '123456')).rejects.toBeInstanceOf(InvalidInputError);
    });
  });

  describe('verifySecondFactor', () => {
    beforeEach(() => prisma.user.findUnique.mockResolvedValue(enabledUser));

    it('accepts a valid code and claims its time step', async () => {
      await service.verifySecondFactor(1, generateTotp(secret));

      expect(prisma.user.updateMany.mock.calls[0][0]).toMatchObject({
        where: { id: 1, OR: [{ totpLastStep: null }, { totpLastStep: { lt: timeStep(Date.now()) } }] },
        data: { totpLastStep: timeStep(Date.now()) },
      });
      expect(attempts.recordSuccess).toHaveBeenCalledWith('2fa:1');
    });

    it('rejects a code whose step was already used (the claim changes no row)', async () => {
      prisma.user.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.verifySecondFactor(1, generateTotp(secret))).rejects.toBeInstanceOf(UnauthenticatedError);
      expect(attempts.recordFailure).toHaveBeenCalledWith('2fa:1');
    });

    it('rejects a wrong code and counts it', async () => {
      await expect(service.verifySecondFactor(1, '000000')).rejects.toBeInstanceOf(UnauthenticatedError);
      expect(attempts.recordFailure).toHaveBeenCalledWith('2fa:1');
      expect(prisma.user.updateMany).not.toHaveBeenCalled();
    });

    it('accepts a recovery code once, whatever its case and dashes', async () => {
      await service.verifySecondFactor(1, 'K3X9M P2QWA');

      expect(prisma.recoveryCode.updateMany).toHaveBeenCalledWith({
        where: { userId: 1, codeHash: hashRecoveryCode('k3x9m-p2qwa'), usedAt: null },
        data: { usedAt: expect.any(Date) },
      });

      prisma.recoveryCode.updateMany.mockResolvedValue({ count: 0 }); // already used
      await expect(service.verifySecondFactor(1, 'k3x9m-p2qwa')).rejects.toBeInstanceOf(UnauthenticatedError);
    });

    it('stops at the lock before reading anything', async () => {
      attempts.assertNotLocked.mockRejectedValue(new Error('locked'));

      await expect(service.verifySecondFactor(1, generateTotp(secret))).rejects.toThrow('locked');
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('rejects a user without the factor instead of letting everything through', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...enabledUser, totpEnabledAt: null });
      await expect(service.verifySecondFactor(1, generateTotp(secret))).rejects.toBeInstanceOf(UnauthenticatedError);
    });
  });

  describe('disable', () => {
    it('needs the right password AND a valid code, then wipes the secret and the recovery codes', async () => {
      const password = await bcrypt.hash('password123', 4);
      prisma.user.findUnique.mockResolvedValue({ ...enabledUser, password });

      await service.disable(1, 'password123', generateTotp(secret));

      expect(prisma.user.update.mock.calls[0][0].data).toEqual({ totpSecret: null, totpEnabledAt: null, totpLastStep: null });
      expect(prisma.recoveryCode.deleteMany).toHaveBeenCalledWith({ where: { userId: 1 } });
    });

    it('refuses a wrong password before looking at the code', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...enabledUser, password: await bcrypt.hash('other', 4) });

      await expect(service.disable(1, 'password123', generateTotp(secret))).rejects.toBeInstanceOf(InvalidInputError);
      expect(prisma.user.updateMany).not.toHaveBeenCalled();
    });

    it('refuses when the factor is not on', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...enabledUser, totpEnabledAt: null });
      await expect(service.disable(1, 'x', '123456')).rejects.toBeInstanceOf(InvalidInputError);
    });
  });
});
