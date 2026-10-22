import { generateSecret, generateTotp, otpauthUri, timeStep, verifyTotp } from './totp';

/** RFC 6238, appendix B: secret "12345678901234567890" (SHA-1). The RFC prints 8 digits, we use the last 6. */
const RFC_SECRET = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
const RFC_VECTORS: [seconds: number, code: string][] = [
  [59, '287082'],
  [1111111109, '081804'],
  [1111111111, '050471'],
  [1234567890, '005924'],
  [2000000000, '279037'],
  [20000000000, '353130'],
];

describe('TOTP', () => {
  it.each(RFC_VECTORS)('matches the RFC 6238 test vector at %i s', (seconds, code) => {
    expect(generateTotp(RFC_SECRET, seconds * 1000)).toBe(code);
  });

  describe('verifyTotp', () => {
    const at = 1_700_000_000_000;

    it('accepts the current code and returns its time step', () => {
      expect(verifyTotp(RFC_SECRET, generateTotp(RFC_SECRET, at), at)).toBe(timeStep(at));
    });

    it('accepts the previous and the next window (clock drift) and reports the step of that window', () => {
      expect(verifyTotp(RFC_SECRET, generateTotp(RFC_SECRET, at - 30_000), at)).toBe(timeStep(at) - 1);
      expect(verifyTotp(RFC_SECRET, generateTotp(RFC_SECRET, at + 30_000), at)).toBe(timeStep(at) + 1);
    });

    it('rejects a code two windows away', () => {
      expect(verifyTotp(RFC_SECRET, generateTotp(RFC_SECRET, at - 60_000), at)).toBeNull();
      expect(verifyTotp(RFC_SECRET, generateTotp(RFC_SECRET, at + 60_000), at)).toBeNull();
    });

    it.each(['', '12345', '1234567', 'abcdef', '12 345'])('rejects a malformed code %j without computing anything', (code) => {
      expect(verifyTotp(RFC_SECRET, code, at)).toBeNull();
    });

    it('rejects a code of another secret', () => {
      expect(verifyTotp(generateSecret(), generateTotp(RFC_SECRET, at), at)).toBeNull();
    });
  });

  it('generates a fresh base32 secret of 160 bits each time', () => {
    const a = generateSecret();
    expect(a).toMatch(/^[A-Z2-7]{32}$/);
    expect(generateSecret()).not.toBe(a);
  });

  it('builds the otpauth link an authenticator app reads', () => {
    const uri = otpauthUri(RFC_SECRET, 'admin@mitso.by');
    expect(uri).toMatch(/^otpauth:\/\/totp\//);
    expect(uri).toContain(`secret=${RFC_SECRET}`);
    expect(uri).toContain('issuer=MITSO');
    expect(uri).toContain('admin%40mitso.by');
  });
});
