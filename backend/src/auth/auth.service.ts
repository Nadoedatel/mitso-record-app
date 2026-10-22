import { Injectable } from '@nestjs/common';
import { InvalidInputError, UnauthenticatedError } from '../common/errors';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'crypto';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordDto, LoginDto } from './dto';
import { SessionRevocationService } from './session-revocation.service';
import { LoginAttemptsService } from './login-attempts.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { JWT_ALGORITHM } from './jwt-secrets';
import { TwoFactorService } from './two-factor/two-factor.service';
import { VerifyTwoFactorDto } from './two-factor/dto';

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** A just-rotated token presented again within this window is a lost race of two tabs, not theft */
const REUSE_GRACE_MS = 10_000;

/** Valid bcrypt hash of a random string; compared against when the email is unknown, so timing does not reveal which emails exist */
const DUMMY_HASH = bcrypt.hashSync(randomUUID(), 10);

/**
 * AuthService - handles authentication logic
 * Manages login, token refresh and logout (users are created by admins via students/teachers modules)
 */
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private loginAttempts: LoginAttemptsService,
    private revocation: SessionRevocationService,
    private twoFactor: TwoFactorService,
  ) {}

  /**
   * Login user with email and password
   */
  async login(dto: LoginDto, userAgent?: string) {
    await this.loginAttempts.assertNotLocked(dto.email);

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Always run one bcrypt compare: unknown email must cost the same time as a wrong password
    const isPasswordValid = await bcrypt.compare(dto.password, user?.password ?? DUMMY_HASH);

    if (!user || !isPasswordValid) {
      await this.loginAttempts.recordFailure(dto.email);
      throw new UnauthenticatedError('Неверный email или пароль');
    }

    await this.loginAttempts.recordSuccess(dto.email);

    // Second factor on: no session yet, the client trades the challenge and a code for tokens (loginWithSecondFactor)
    if (user.totpEnabledAt) {
      return { twoFactorRequired: true as const, challengeToken: await this.twoFactor.createChallenge(user.id) };
    }

    return this.startSession(user, userAgent);
  }

  /**
   * Second login step: a valid challenge token (from the password step) plus a code from the app or a recovery code.
   * @throws UnauthenticatedError for an expired challenge or a wrong code
   */
  async loginWithSecondFactor(dto: VerifyTwoFactorDto, userAgent?: string) {
    const userId = this.twoFactor.verifyChallenge(dto.challengeToken);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.totpEnabledAt) {
      throw new UnauthenticatedError('Время подтверждения истекло. Войдите заново.');
    }

    await this.twoFactor.verifySecondFactor(user.id, dto.code);
    return this.startSession(user, userAgent);
  }

  /** New session of a user who passed every login step: tokens, a refresh session row, the public user fields */
  private async startSession(user: { id: number; email: string; role: Role }, userAgent?: string) {
    // New login = new family (one family per device)
    const familyId = randomUUID();
    const tokens = await this.generateTokens({ sub: user.id, email: user.email, role: user.role, sid: familyId });
    await this.createSession(user.id, familyId, tokens.refreshToken, userAgent);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  /**
   * Rotate the refresh token. Every token is single-use: using it marks the row, and the next
   * token joins the same family. A token that was already used (outside the grace window) means
   * someone holds a copy, so the whole family (that device's login) is revoked.
   */
  async refresh(refreshToken: string, userAgent?: string) {
    if (!refreshToken) {
      throw new UnauthenticatedError('Токен обновления не передан');
    }

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
        algorithms: [JWT_ALGORITHM],
      });
    } catch {
      throw new UnauthenticatedError('Недействительный токен обновления');
    }

    const session = await this.prisma.refreshSession.findUnique({
      where: { tokenHash: this.hashToken(refreshToken) },
      include: { user: true },
    });

    if (!session || session.userId !== payload.sub || session.expiresAt.getTime() <= Date.now()) {
      throw new UnauthenticatedError('Недействительный токен обновления');
    }

    if (session.usedAt) {
      if (Date.now() - session.usedAt.getTime() > REUSE_GRACE_MS) {
        await this.revokeFamilies([session.familyId]);
      }
      throw new UnauthenticatedError('Недействительный токен обновления');
    }

    // Atomic claim: of two parallel requests with the same token only one flips usedAt
    const claimed = await this.prisma.refreshSession.updateMany({
      where: { id: session.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (claimed.count === 0) {
      throw new UnauthenticatedError('Недействительный токен обновления');
    }

    const tokens = await this.generateTokens({
      sub: session.user.id,
      email: session.user.email,
      role: session.user.role,
      sid: session.familyId,
    });
    await this.createSession(session.user.id, session.familyId, tokens.refreshToken, userAgent);

    return tokens;
  }

  /**
   * Get current user profile with related student or teacher data
   */
  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: {
          include: {
            group: {
              include: {
                faculty: true,
              },
            },
            specialization: {
              include: {
                faculty: true,
              },
            },
          },
        },
        teacher: {
          include: {
            teacherSubjects: {
              include: {
                subject: {
                  include: {
                    subjectGroups: {
                      include: {
                        group: {
                          include: {
                            faculty: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthenticatedError('Пользователь не найден');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      student: user.student || null,
      teacher: user.teacher || null,
      twoFactorEnabled: user.totpEnabledAt !== null,
    };
  }

  /**
   * Logout: revoke the device that sent the cookie; without a usable cookie revoke all devices
   */
  async logout(userId: number, refreshToken?: string) {
    const current = refreshToken
      ? await this.prisma.refreshSession.findUnique({ where: { tokenHash: this.hashToken(refreshToken) } })
      : null;

    if (current && current.userId === userId) {
      await this.revokeFamilies([current.familyId]);
    } else {
      await this.revokeAllSessions(userId);
    }

    return { message: 'Вы вышли из системы' };
  }

  /**
   * Change the password and sign the user out everywhere (the old password may be what leaked).
   * A wrong current password counts as a failed login attempt: otherwise a stolen access token
   * would give an unlimited password-guessing oracle that bypasses the login lockout.
   */
  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthenticatedError('Пользователь не найден');
    }

    await this.loginAttempts.assertNotLocked(user.email);

    if (!(await bcrypt.compare(dto.currentPassword, user.password))) {
      await this.loginAttempts.recordFailure(user.email);
      throw new InvalidInputError('Текущий пароль указан неверно');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: await bcrypt.hash(dto.newPassword, 10) },
    });
    await this.revokeAllSessions(userId);

    return { message: 'Пароль изменён. Войдите снова.' };
  }

  private async revokeAllSessions(userId: number) {
    const rows = await this.prisma.refreshSession.findMany({
      where: { userId },
      select: { familyId: true },
      distinct: ['familyId'],
    });
    await this.revokeFamilies(rows.map((row) => row.familyId));
  }

  /**
   * Kill whole logins: delete their refresh rows and mark the families so access tokens issued
   * for them stop working at once, not when they expire
   */
  private async revokeFamilies(familyIds: string[]) {
    if (familyIds.length === 0) return;
    await this.prisma.refreshSession.deleteMany({ where: { familyId: { in: familyIds } } });
    await Promise.all(familyIds.map((id) => this.revocation.revoke(id)));
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(payload: JwtPayload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: '15m',
        algorithm: JWT_ALGORITHM,
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '7d',
        algorithm: JWT_ALGORITHM,
        // Unique id: two refresh tokens of one user must never be identical (even within one second)
        jwtid: randomUUID(),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Hash a refresh token for storage.
   * SHA-256 instead of bcrypt: bcrypt only reads the first 72 bytes, and the start of every JWT of
   * one user is identical, so a bcrypt hash could not tell tokens apart. The token is long random
   * data, so a fast hash is safe (no brute force of a weak secret, unlike passwords).
   */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Store a refresh token (hash only) as a new row of the family; expired rows of the user are purged on the way
   */
  private async createSession(userId: number, familyId: string, refreshToken: string, userAgent?: string) {
    await this.prisma.$transaction([
      this.prisma.refreshSession.deleteMany({ where: { userId, expiresAt: { lt: new Date() } } }),
      this.prisma.refreshSession.create({
        data: {
          userId,
          familyId,
          tokenHash: this.hashToken(refreshToken),
          expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
          userAgent: userAgent?.slice(0, 255) ?? null,
        },
      }),
    ]);
  }
}
