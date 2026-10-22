import { InvalidInputError } from '../errors';
import { decodeCursor, encodeCursor } from './keyset-cursor';

describe('keyset cursor', () => {
  const position = { at: '2026-10-14T10:00:00.000Z', id: 42 };

  it('round-trips a position', () => {
    expect(decodeCursor(encodeCursor(position))).toEqual(position);
  });

  it('is plain url-safe text, not readable JSON', () => {
    const cursor = encodeCursor(position);

    expect(cursor).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(cursor).not.toContain('2026');
  });

  it.each([
    ['garbage', 'not a cursor!'],
    ['empty', ''],
    ['JSON that is not an object', Buffer.from('42').toString('base64url')],
    ['no id', Buffer.from(JSON.stringify({ at: '2026-10-14T10:00:00.000Z' })).toString('base64url')],
    ['a string id', Buffer.from(JSON.stringify({ at: '2026-10-14T10:00:00.000Z', id: '5' })).toString('base64url')],
    ['a fractional id', Buffer.from(JSON.stringify({ at: '2026-10-14T10:00:00.000Z', id: 1.5 })).toString('base64url')],
    ['a date that is not a date', Buffer.from(JSON.stringify({ at: 'yesterday', id: 1 })).toString('base64url')],
    ['truncated', encodeCursor(position).slice(0, 10)],
  ])('rejects %s as invalid input', (_label, cursor) => {
    expect(() => decodeCursor(cursor)).toThrow(InvalidInputError);
  });
});
