import { UnauthorizedException } from '@nestjs/common';
import { AuthUserCache } from '../../cache';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy.validate', () => {
  const authUsers = { get: jest.fn() };
  let strategy: JwtStrategy;

  beforeAll(() => {
    process.env.JWT_ACCESS_SECRET = 'test-secret';
  });

  beforeEach(() => {
    jest.resetAllMocks();
    strategy = new JwtStrategy(authUsers as unknown as AuthUserCache);
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
});
