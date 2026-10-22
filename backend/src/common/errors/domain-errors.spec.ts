import {
  ConflictError,
  DomainError,
  ForbiddenError,
  InvalidInputError,
  NotFoundError,
  statusOf,
  TooManyAttemptsError,
  UnauthenticatedError,
  UnavailableError,
} from './domain-errors';

describe('domain errors', () => {
  it('are Errors with their own class name, so logs and stack traces read well', () => {
    const error = new NotFoundError('Студент не найден');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(DomainError);
    expect(error.name).toBe('NotFoundError');
    expect(error.message).toBe('Студент не найден');
  });

  it.each([
    [NotFoundError, 404],
    [ConflictError, 409],
    [ForbiddenError, 403],
    [InvalidInputError, 400],
    [UnauthenticatedError, 401],
    [UnavailableError, 503],
  ])('%p maps to HTTP %i', (ErrorClass, status) => {
    expect(statusOf(new ErrorClass('x'))).toBe(status);
  });

  it('too many attempts maps to 429 and may carry the wait', () => {
    const error = new TooManyAttemptsError('Подождите', 30);

    expect(statusOf(error)).toBe(429);
    expect(error.retryAfterSeconds).toBe(30);
  });
});
