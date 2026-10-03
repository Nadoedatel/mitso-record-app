/** Shortest acceptable JWT secret. 32 chars of random data is ~190 bits for base64, far beyond brute force. */
export const MIN_SECRET_LENGTH = 32;

/** The only signing algorithm we use (symmetric, one backend signs and verifies). */
export const JWT_ALGORITHM = 'HS256' as const;

const PLACEHOLDER = /replace[-_ ]?with|change[-_ ]?me|your[-_ ]|example|secret-here/i;

/**
 * Fails fast at startup when a JWT secret is missing, short, copied from .env.example,
 * or shared between access and refresh tokens (then a leaked access token could pass as refresh).
 * Returns the problems instead of throwing so the caller decides how to report them.
 */
export function findJwtSecretProblems(env: NodeJS.ProcessEnv): string[] {
  const problems: string[] = [];
  const names = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const;

  for (const name of names) {
    const value = env[name];
    if (!value) problems.push(`${name} is not set`);
    else if (value.length < MIN_SECRET_LENGTH) problems.push(`${name} is shorter than ${MIN_SECRET_LENGTH} characters`);
    else if (PLACEHOLDER.test(value)) problems.push(`${name} looks like a placeholder from .env.example`);
  }

  if (env.JWT_ACCESS_SECRET && env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) {
    problems.push('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must differ');
  }
  return problems;
}

/** Throws one error listing every problem. Hint shows how to generate a good secret. */
export function assertJwtSecrets(env: NodeJS.ProcessEnv): void {
  const problems = findJwtSecretProblems(env);
  if (problems.length > 0) {
    throw new Error(
      `Invalid JWT configuration: ${problems.join('; ')}. ` +
        `Generate one with: node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`,
    );
  }
}
