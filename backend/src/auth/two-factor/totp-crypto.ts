import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_BYTES = 32;
const IV_BYTES = 12;
const VERSION = 'v1';

/**
 * Reads the key that encrypts TOTP secrets in the database: TOTP_ENCRYPTION_KEY, 32 random bytes as base64.
 * Returns null when it is not set (two-factor cannot be enabled then); a set but malformed key is an error,
 * because encrypting with a wrong-sized key would silently weaken or break everything.
 */
export function loadEncryptionKey(env: NodeJS.ProcessEnv = process.env): Buffer | null {
  const raw = env.TOTP_ENCRYPTION_KEY;
  if (!raw) return null;
  const key = Buffer.from(raw, 'base64');
  if (key.length !== KEY_BYTES) {
    throw new Error(
      `TOTP_ENCRYPTION_KEY must be ${KEY_BYTES} bytes in base64. ` +
        `Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`,
    );
  }
  return key;
}

/**
 * Encrypts a TOTP secret (AES-256-GCM, a fresh random IV for every call).
 * Format: `v1.<iv>.<auth tag>.<ciphertext>`, each part base64url. GCM also authenticates, so a changed value fails to decrypt.
 */
export function encryptSecret(plain: string, key: Buffer): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return [VERSION, iv, cipher.getAuthTag(), data].map((part) => (typeof part === 'string' ? part : part.toString('base64url'))).join('.');
}

/** Reverses `encryptSecret`. @throws Error for a wrong key, a damaged value or an unknown format */
export function decryptSecret(payload: string, key: Buffer): string {
  const [version, iv, tag, data] = payload.split('.');
  if (version !== VERSION || !iv || !tag || !data) throw new Error('Unknown format of the encrypted secret');
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8');
}
