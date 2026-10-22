import {
  generateRecoveryCode,
  generateRecoveryCodes,
  hashRecoveryCode,
  looksLikeRecoveryCode,
  normalizeRecoveryCode,
} from './recovery-codes';

describe('recovery codes', () => {
  it('has two groups of five unambiguous characters', () => {
    expect(generateRecoveryCode()).toMatch(/^[a-hj-km-np-z2-9]{5}-[a-hj-km-np-z2-9]{5}$/);
  });

  it('makes ten different codes by default', () => {
    const codes = generateRecoveryCodes();
    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
  });

  it('ignores case, spaces and the dash when a person types a code', () => {
    expect(normalizeRecoveryCode(' K3X9M-p2qwa ')).toBe('k3x9mp2qwa');
    expect(hashRecoveryCode('K3X9M-P2QWA')).toBe(hashRecoveryCode('k3x9m p2qwa'));
  });

  it('hashes to SHA-256 hex and never to the code itself', () => {
    const hash = hashRecoveryCode('k3x9m-p2qwa');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain('k3x9m');
  });

  it('tells a recovery code from a 6-digit code', () => {
    expect(looksLikeRecoveryCode('k3x9m-p2qwa')).toBe(true);
    expect(looksLikeRecoveryCode('123456')).toBe(false);
  });
});
