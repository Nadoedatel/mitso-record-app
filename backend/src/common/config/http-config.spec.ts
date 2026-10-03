import { getAllowedOrigins, parseTrustProxy } from './http-config';

describe('parseTrustProxy', () => {
  it.each([undefined, '', '  ', 'false', 'FALSE'])('is off for %p', (v) => {
    expect(parseTrustProxy(v)).toBe(false);
  });
  it('turns a number into a hop count', () => {
    expect(parseTrustProxy('1')).toBe(1);
    expect(parseTrustProxy(' 2 ')).toBe(2);
  });
  it('passes presets and subnets through', () => {
    expect(parseTrustProxy('loopback')).toBe('loopback');
    expect(parseTrustProxy('10.0.0.0/8')).toBe('10.0.0.0/8');
  });
  it('refuses "true": it would trust any sender', () => {
    expect(() => parseTrustProxy('true')).toThrow(/hop count/);
  });
});

describe('getAllowedOrigins', () => {
  it('defaults to the local frontend', () => {
    expect(getAllowedOrigins({})).toEqual(['http://localhost:3000']);
  });
  it('splits a list and drops trailing slashes', () => {
    expect(getAllowedOrigins({ FRONTEND_URL: 'https://a.by/, https://b.by' })).toEqual(['https://a.by', 'https://b.by']);
  });
});
