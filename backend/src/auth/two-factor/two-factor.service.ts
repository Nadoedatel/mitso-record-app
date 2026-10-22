import { Injectable } from '@nestjs/common';
import { ConflictError, InvalidInputError, UnauthenticatedError, UnavailableError } from '../../common/errors';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHmac } from 'crypto';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../prisma/prisma.service';
import { JWT_ALGORITHM } from '../jwt-secrets';
import { LoginAttemptsService } from '../login-attempts.service';
import { decryptSecret, encryptSecret, loadEncryptionKey } from './totp-crypto';
import {
  generateRecoveryCodes,
  hashRecoveryCode,
  looksLikeRecoveryCode,
} from './recovery-codes';
import { generateSecret, otpauthUri, verifyTotp } from './totp';

const CHALLENGE_PURPOSE = '2fa-challenge';
const CHALLENGE_TTL = '5m';

interface ChallengePayload {
  sub: number;
  purpose: typeof CHALLENGE_PURPOSE;
}

/**
 * TwoFactorService - TOTP second factor (an authenticator app) with one-time recovery codes.
 *
 * Login with the factor on: the password step ends with a short-lived challenge token (no session yet),
 * the code step trades it for the normal tokens. The secret lives encrypted in the database;
 * a code is accepted once (its time step is stored), and wrong codes lock the account like wrong passwords do.
 */
@Injectable()
export class TwoFactorService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private attempts: LoginAttemptsService,
  ) {}

  /**
   * Challenge token for the second login step.
   * It is signed with a key derived from the access secret, so it can never be used as an access token
   * (the access strategy verifies with the plain secret and would reject it).
   */
  async createChallenge(userId: number): Promise<string> {
    const payload: ChallengePayload = { sub: userId, purpose: CHALLENGE_PURPOSE };
    return this.jwtService.signAsync(payload, { secret: this.challengeSecret(), expiresIn: CHALLENGE_TTL, algorithm: JWT_ALGORITHM });
  }

  /** User id from a challenge token. @throws UnauthenticatedError if it is invalid or expired */
  verifyChallenge(token: string): number {
    try {
      const payload = this.jwtService.verify<ChallengePayload>(token, { secret: this.challengeSecret(), algorithms: [JWT_ALGORITHM] });
      if (payload.purpose !== CHALLENGE_PURPOSE) throw new Error('wrong purpose');
      return payload.sub;
    } catch {
      throw new UnauthenticatedError('Время подтверждения истекло. Войдите заново.');
    }
  }

  /**
   * Start the setup: create a new secret (replacing an unfinished one) and return it with a QR code.
   * The factor is not on until `enable` gets a valid code, so a user who abandons the setup is not locked out.
   * @throws ConflictError if it is already on
   * @throws UnavailableError if the server has no encryption key
   */
  async setup(userId: number, email: string) {
    const key = this.requireKey();
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { totpEnabledAt: true } });
    if (user?.totpEnabledAt) throw new ConflictError('Двухфакторная защита уже включена');

    const secret = generateSecret();
    await this.prisma.user.update({
      where: { id: userId },
      data: { totpSecret: encryptSecret(secret, key), totpEnabledAt: null, totpLastStep: null },
    });

    const uri = otpauthUri(secret, email);
    return { secret, otpauthUri: uri, qrCode: await QRCode.toDataURL(uri, { margin: 1, width: 220 }) };
  }

  /**
   * Finish the setup with the first code. Returns the recovery codes: this is the only time they are shown.
   * @throws InvalidInputError if no setup was started, or the code is wrong
   */
  async enable(userId: number, code: string): Promise<string[]> {
    const key = this.requireKey();
    await this.attempts.assertNotLocked(this.attemptKey(userId));

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.totpSecret) throw new InvalidInputError('Сначала начните настройку двухфакторной защиты');
    if (user.totpEnabledAt) throw new ConflictError('Двухфакторная защита уже включена');

    const step = verifyTotp(decryptSecret(user.totpSecret, key), code);
    if (step === null) {
      await this.attempts.recordFailure(this.attemptKey(userId));
      throw new InvalidInputError('Неверный код. Проверьте время на телефоне и попробуйте ещё раз.');
    }
    await this.attempts.recordSuccess(this.attemptKey(userId));

    const codes = generateRecoveryCodes();
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { totpEnabledAt: new Date(), totpLastStep: step } }),
      this.prisma.recoveryCode.deleteMany({ where: { userId } }),
      this.prisma.recoveryCode.createMany({ data: codes.map((value) => ({ userId, codeHash: hashRecoveryCode(value) })) }),
    ]);
    return codes;
  }

  /**
   * Turn the factor off. Needs the password AND a code (or a recovery code): an access token alone must not be enough.
   * @throws InvalidInputError for a wrong password, UnauthenticatedError for a wrong code
   */
  async disable(userId: number, password: string, code: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.totpEnabledAt) throw new InvalidInputError('Двухфакторная защита не включена');

    await this.attempts.assertNotLocked(user.email);
    if (!(await bcrypt.compare(password, user.password))) {
      await this.attempts.recordFailure(user.email);
      throw new InvalidInputError('Пароль указан неверно');
    }

    await this.verifySecondFactor(userId, code);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { totpSecret: null, totpEnabledAt: null, totpLastStep: null } }),
      this.prisma.recoveryCode.deleteMany({ where: { userId } }),
    ]);
  }

  /**
   * Check the second factor of a user: a 6-digit code from the app or a recovery code.
   * Wrong attempts are counted per user (5 mistakes lock it for a while, the same rule as for passwords).
   * @throws UnauthenticatedError for a wrong, reused or expired code; TooManyAttemptsError while locked
   */
  async verifySecondFactor(userId: number, input: string): Promise<void> {
    const key = this.requireKey();
    await this.attempts.assertNotLocked(this.attemptKey(userId));

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const accepted = user?.totpSecret && user.totpEnabledAt
      ? looksLikeRecoveryCode(input)
        ? await this.useRecoveryCode(userId, input)
        : await this.useTotpCode(userId, decryptSecret(user.totpSecret, key), input)
      : false;

    if (!accepted) {
      await this.attempts.recordFailure(this.attemptKey(userId));
      throw new UnauthenticatedError('Неверный или уже использованный код');
    }
    await this.attempts.recordSuccess(this.attemptKey(userId));
  }

  /**
   * A TOTP code counts once: the claim of its time step is one conditional UPDATE, so two parallel requests
   * with the same code cannot both pass (only one changes a row).
   */
  private async useTotpCode(userId: number, secret: string, code: string): Promise<boolean> {
    const step = verifyTotp(secret, code);
    if (step === null) return false;
    const claimed = await this.prisma.user.updateMany({
      where: { id: userId, OR: [{ totpLastStep: null }, { totpLastStep: { lt: step } }] },
      data: { totpLastStep: step },
    });
    return claimed.count === 1;
  }

  /** A recovery code works once: marking it used is one conditional UPDATE (same reasoning as above) */
  private async useRecoveryCode(userId: number, input: string): Promise<boolean> {
    const claimed = await this.prisma.recoveryCode.updateMany({
      where: { userId, codeHash: hashRecoveryCode(input), usedAt: null },
      data: { usedAt: new Date() },
    });
    return claimed.count === 1;
  }

  private requireKey(): Buffer {
    const key = loadEncryptionKey();
    if (!key) throw new UnavailableError('Двухфакторная защита недоступна: не задан TOTP_ENCRYPTION_KEY');
    return key;
  }

  /** Counter key of the lockout; the `2fa:` prefix keeps it apart from the password counter of the same account */
  private attemptKey(userId: number): string {
    return `2fa:${userId}`;
  }

  private challengeSecret(): string {
    const accessSecret = process.env.JWT_ACCESS_SECRET;
    if (!accessSecret) throw new Error('JWT_ACCESS_SECRET is not set');
    return createHmac('sha256', accessSecret).update(CHALLENGE_PURPOSE).digest('hex');
  }
}
