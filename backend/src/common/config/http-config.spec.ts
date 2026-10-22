import { getAllowedOrigins, parseRateLimit, parseTrustProxy } from './http-config';

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

describe('parseRateLimit', () => {
  it.each([undefined, '', '  '])('is 60 for %p', (v) => {
    expect(parseRateLimit(v)).toBe(60);
  });
  it('reads a positive whole number', () => {
    expect(parseRateLimit('600')).toBe(600);
    expect(parseRateLimit(' 5 ')).toBe(5);
  });
  it.each(['0', '-1', '1.5', 'many', '10x'])('refuses %p: a typo must not switch the limit off', (v) => {
    expect(() => parseRateLimit(v)).toThrow(/positive whole number/);
  });
});
