import { InvalidInputError } from '../errors';

/**
 * Position in a list ordered by (time, id), newest first. The pair is unique, so the next page can start
 * exactly after it, even when several rows share one timestamp.
 */
export interface KeysetPosition {
  /** ISO timestamp of the last row of the page */
  at: string;
  id: number;
}

/** Opaque text for the client: base64url of JSON. The client only hands it back, it never reads it. */
export function encodeCursor(position: KeysetPosition): string {
  return Buffer.from(JSON.stringify(position)).toString('base64url');
}

/**
 * Reads a cursor the client sent back.
 * @throws InvalidInputError for anything that is not a cursor we made: a hand-edited or truncated value is a 400, not a 500
 */
export function decodeCursor(cursor: string): KeysetPosition {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    if (typeof parsed === 'object' && parsed !== null) {
      const { at, id } = parsed as Record<string, unknown>;
      if (typeof at === 'string' && !Number.isNaN(Date.parse(at)) && typeof id === 'number' && Number.isInteger(id)) {
        return { at, id };
      }
    }
  } catch {
    // falls through to the error below
  }
  throw new InvalidInputError('Некорректный курсор страницы');
}
