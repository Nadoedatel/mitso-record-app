import { assertJwtSecrets, findJwtSecretProblems } from './jwt-secrets';

const good = 'a'.repeat(20) + 'B'.repeat(20);
const other = 'c'.repeat(20) + 'D'.repeat(20);

describe('findJwtSecretProblems', () => {
  it('accepts two long distinct secrets', () => {
    expect(findJwtSecretProblems({ JWT_ACCESS_SECRET: good, JWT_REFRESH_SECRET: other })).toEqual([]);
  });

  it('reports missing secrets', () => {
    expect(findJwtSecretProblems({})).toHaveLength(2);
  });

  it('rejects short secrets', () => {
    const p = findJwtSecretProblems({ JWT_ACCESS_SECRET: 'short', JWT_REFRESH_SECRET: other });
    expect(p).toEqual(['JWT_ACCESS_SECRET is shorter than 32 characters']);
  });

  it('rejects the placeholder from .env.example even when it is long enough', () => {
    const p = findJwtSecretProblems({
      JWT_ACCESS_SECRET: 'replace-with-strong-random-secret-please',
      JWT_REFRESH_SECRET: other,
    });
    expect(p[0]).toMatch(/placeholder/);
  });

  it('rejects one secret used for both tokens', () => {
    const p = findJwtSecretProblems({ JWT_ACCESS_SECRET: good, JWT_REFRESH_SECRET: good });
    expect(p).toEqual(['JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must differ']);
  });
});

describe('assertJwtSecrets', () => {
  it('throws with all problems and a generation hint', () => {
    expect(() => assertJwtSecrets({})).toThrow(/not set.*randomBytes/s);
  });
  it('passes silently for valid config', () => {
    expect(() => assertJwtSecrets({ JWT_ACCESS_SECRET: good, JWT_REFRESH_SECRET: other })).not.toThrow();
  });
});
