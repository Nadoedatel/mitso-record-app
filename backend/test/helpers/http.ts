import * as request from 'supertest';

/** Reads the raw `Set-Cookie` line for a cookie name (undefined if the response did not set it). */
export function getSetCookie(res: request.Response, name: string): string | undefined {
  const header = res.headers['set-cookie'] as unknown as string[] | undefined;
  return header?.find((line) => line.startsWith(`${name}=`));
}

/** Extracts just the cookie value, e.g. the refresh JWT, from a response. */
export function getCookieValue(res: request.Response, name: string): string | undefined {
  const line = getSetCookie(res, name);
  return line?.split(';')[0].slice(name.length + 1);
}

/** Every raw `Set-Cookie` line of a response. */
export function getAllSetCookies(res: request.Response): string[] {
  return (res.headers['set-cookie'] as unknown as string[] | undefined) ?? [];
}
