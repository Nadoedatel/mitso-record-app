import { randomBytes } from 'crypto';
import { decryptSecret, encryptSecret, loadEncryptionKey } from './totp-crypto';

describe('TOTP secret encryption', () => {
  const key = randomBytes(32);

  it('decrypts what it encrypted', () => {
    expect(decryptSecret(encryptSecret('JBSWY3DPEHPK3PXP', key), key)).toBe('JBSWY3DPEHPK3PXP');
  });

  it('does not contain the secret and differs on every call (fresh IV)', () => {
    const a = encryptSecret('JBSWY3DPEHPK3PXP', key);
    expect(a).not.toContain('JBSWY3DPEHPK3PXP');
    expect(encryptSecret('JBSWY3DPEHPK3PXP', key)).not.toBe(a);
  });

  it('refuses a wrong key and a tampered value', () => {
    const encrypted = encryptSecret('JBSWY3DPEHPK3PXP', key);
    expect(() => decryptSecret(encrypted, randomBytes(32))).toThrow();
    const [version, iv, tag, data] = encrypted.split('.');
    const flipped = `${data.startsWith('A') ? 'B' : 'A'}${data.slice(1)}`;
    expect(() => decryptSecret([version, iv, tag, flipped].join('.'), key)).toThrow();
  });

  it('refuses an unknown format', () => {
    expect(() => decryptSecret('plain-text', key)).toThrow('Unknown format');
  });

  describe('loadEncryptionKey', () => {
    it('is null when the variable is not set', () => {
      expect(loadEncryptionKey({})).toBeNull();
    });

    it('reads 32 bytes of base64', () => {
      expect(loadEncryptionKey({ TOTP_ENCRYPTION_KEY: key.toString('base64') })).toEqual(key);
    });

    it('fails loudly on a key of the wrong size', () => {
      expect(() => loadEncryptionKey({ TOTP_ENCRYPTION_KEY: randomBytes(16).toString('base64') })).toThrow('32 bytes');
    });
  });
});
