import * as OTPAuth from 'otpauth';

/** What authenticator apps expect by default (RFC 6238): 6 digits, a new code every 30 seconds, SHA-1 */
export const TOTP_PERIOD_SECONDS = 30;
export const TOTP_DIGITS = 6;
/** Accept the previous and the next code too: clocks of phone and server differ by a few seconds */
export const TOTP_WINDOW = 1;
const ISSUER = 'MITSO Record';

function totpFor(secret: string, label: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: ISSUER,
    label,
    algorithm: 'SHA1',
    digits: TOTP_DIGITS,
    period: TOTP_PERIOD_SECONDS,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
}

/** New random secret (160 bits, base32 as authenticator apps show it) */
export function generateSecret(): string {
  return new OTPAuth.Secret({ size: 20 }).base32;
}

/** `otpauth://` link that an authenticator app reads from a QR code */
export function otpauthUri(secret: string, accountEmail: string): string {
  return totpFor(secret, accountEmail).toString();
}

/** Number of the 30-second window that contains the moment `at` (milliseconds) */
export function timeStep(at: number): number {
  return Math.floor(at / 1000 / TOTP_PERIOD_SECONDS);
}

/**
 * Checks a 6-digit code against the secret around the moment `at`.
 * Returns the time step the code belongs to (the caller stores it to refuse a second use), or null for a wrong code.
 */
export function verifyTotp(secret: string, code: string, at: number = Date.now()): number | null {
  if (!/^\d{6}$/.test(code)) return null;
  const delta = totpFor(secret, 'verify').validate({ token: code, timestamp: at, window: TOTP_WINDOW });
  return delta === null ? null : timeStep(at) + delta;
}

/** The code valid at the moment `at`; for tests and for the e2e helper */
export function generateTotp(secret: string, at: number = Date.now()): string {
  return totpFor(secret, 'generate').generate({ timestamp: at });
}
