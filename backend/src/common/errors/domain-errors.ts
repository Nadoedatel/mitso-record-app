/**
 * Errors of the business logic. They say WHAT went wrong in domain terms ("not found", "already exists",
 * "not allowed") and know nothing about HTTP: services throw these, so they stay usable from a job, a script or
 * a test without an HTTP layer. The global exception filter turns them into status codes (see `statusOf`).
 * The message is for the user and is sent as it is, so write it in Russian.
 */
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** The thing asked for does not exist (404) */
export class NotFoundError extends DomainError {}

/** The request clashes with the current state, e.g. the email is taken (409) */
export class ConflictError extends DomainError {}

/** The caller is known but may not do this (403) */
export class ForbiddenError extends DomainError {}

/** The input is well-formed but makes no sense for the domain, e.g. a wrong grade value (400) */
export class InvalidInputError extends DomainError {}

/** The caller could not prove who they are: wrong password, wrong or expired code or token (401) */
export class UnauthenticatedError extends DomainError {}

/** Too many failed attempts; try again later (429) */
export class TooManyAttemptsError extends DomainError {
  constructor(
    message: string,
    readonly retryAfterSeconds?: number,
  ) {
    super(message);
  }
}

/** A part the feature needs is not available: no Redis, no key, database down (503) */
export class UnavailableError extends DomainError {}

/** HTTP status for a domain error. The only place that knows both worlds. */
export function statusOf(error: DomainError): number {
  if (error instanceof NotFoundError) return 404;
  if (error instanceof ConflictError) return 409;
  if (error instanceof ForbiddenError) return 403;
  if (error instanceof InvalidInputError) return 400;
  if (error instanceof UnauthenticatedError) return 401;
  if (error instanceof TooManyAttemptsError) return 429;
  if (error instanceof UnavailableError) return 503;
  return 500;
}
