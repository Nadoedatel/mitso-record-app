import { createHash, randomInt } from 'crypto';

/** No 0/o, 1/l/i: a code is read from paper and typed by hand */
const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
const GROUP_LENGTH = 5;
export const RECOVERY_CODE_COUNT = 10;

/** One code: two groups of five characters, e.g. `k3x9m-p2qwa` (about 49 bits, fine for one-time codes behind a lockout) */
export function generateRecoveryCode(): string {
  const group = () => Array.from({ length: GROUP_LENGTH }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
  return `${group()}-${group()}`;
}

export function generateRecoveryCodes(count: number = RECOVERY_CODE_COUNT): string[] {
  return Array.from({ length: count }, generateRecoveryCode);
}

/** Case, spaces and the dash do not matter when the user types a code */
export function normalizeRecoveryCode(input: string): string {
  return input.toLowerCase().replace(/[\s-]/g, '');
}

/** True when the input has the shape of a recovery code (and not of a 6-digit TOTP code) */
export function looksLikeRecoveryCode(input: string): boolean {
  return normalizeRecoveryCode(input).length === GROUP_LENGTH * 2;
}

/** SHA-256 is enough: the codes are random, there is nothing to brute-force offline, unlike a human password */
export function hashRecoveryCode(input: string): string {
  return createHash('sha256').update(normalizeRecoveryCode(input)).digest('hex');
}
