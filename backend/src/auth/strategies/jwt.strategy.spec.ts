import { UnauthorizedException } from '@nestjs/common';
import { AuthUserCache } from '../../cache';
import { SessionRevocationService } from '../session-revocation.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy.validate', () => {
  const authUsers = { get: jest.fn() };
  const revocation = { isRevoked: jest.fn() };
  let strategy: JwtStrategy;

  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = 'test-secret';
  });

  beforeEach(() => {
    jest.resetAllMocks();
    strategy = new JwtStrategy(authUsers as unknown as AuthUserCache, revocation as unknown as SessionRevocationService);
    revocation.isRevoked.mockResolvedValue(false);
  });

  it('returns the user of the token subject', async () => {
    authUsers.get.mockResolvedValue({ id: 7, email: 'a@mitso.by', role: 'TEACHER' });

    expect(await strategy.validate({ sub: 7, email: 'a@mitso.by', role: 'TEACHER' })).toEqual({
      id: 7,
      email: 'a@mitso.by',
      role: 'TEACHER',
    });
    expect(authUsers.get).toHaveBeenCalledWith(7);
  });

  it('rejects a token whose user no longer exists', async () => {
    authUsers.get.mockResolvedValue(null);

    await expect(strategy.validate({ sub: 7, email: 'a@mitso.by', role: 'STUDENT' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('trusts the stored role, not the role inside the token', async () => {
    // A token issued when the user was a student keeps saying STUDENT after promotion, and the reverse
    authUsers.get.mockResolvedValue({ id: 7, email: 'a@mitso.by', role: 'ADMIN' });

    const user = await strategy.validate({ sub: 7, email: 'a@mitso.by', role: 'STUDENT' });

    expect(user.role).toBe('ADMIN');
  });

  it('rejects a token whose session was revoked (logout, detected theft), without loading the user', async () => {
    revocation.isRevoked.mockResolvedValue(true);

    await expect(strategy.validate({ sub: 7, email: 'a@mitso.by', role: 'STUDENT', sid: 'family-1' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(revocation.isRevoked).toHaveBeenCalledWith('family-1');
    expect(authUsers.get).not.toHaveBeenCalled();
  });

  it('accepts tokens without sid (issued before sessions existed)', async () => {
    authUsers.get.mockResolvedValue({ id: 7, email: 'a@mitso.by', role: 'STUDENT' });

    await strategy.validate({ sub: 7, email: 'a@mitso.by', role: 'STUDENT' });

    expect(revocation.isRevoked).not.toHaveBeenCalled();
  });
});
