import type { ErrorEvent } from '@sentry/nestjs';
import { buildSentryOptions, scrubEvent } from './sentry.config';

describe('buildSentryOptions', () => {
  it('is disabled without a DSN', () => {
    expect(buildSentryOptions({})).toBeUndefined();
    expect(buildSentryOptions({ SENTRY_DSN: '' })).toBeUndefined();
  });

  it('builds options from the environment', () => {
    const options = buildSentryOptions({
      SENTRY_DSN: 'https://key@o1.ingest.sentry.io/1',
      NODE_ENV: 'production',
      RENDER_GIT_COMMIT: 'abc123',
    });

    expect(options).toMatchObject({
      dsn: 'https://key@o1.ingest.sentry.io/1',
      environment: 'production',
      release: 'abc123',
      tracesSampleRate: 0,
    });
  });

  it('prefers explicit SENTRY_* settings over the platform defaults', () => {
    const options = buildSentryOptions({
      SENTRY_DSN: 'https://key@o1.ingest.sentry.io/1',
      NODE_ENV: 'production',
      SENTRY_ENVIRONMENT: 'staging',
      SENTRY_RELEASE: 'v3.2.7',
      RENDER_GIT_COMMIT: 'abc123',
    });

    expect(options).toMatchObject({ environment: 'staging', release: 'v3.2.7' });
  });

  it.each([
    ['0.25', 0.25],
    ['5', 1],
    ['-1', 0],
    ['abc', 0],
  ])('clamps SENTRY_TRACES_SAMPLE_RATE=%s to %d', (raw, expected) => {
    const options = buildSentryOptions({ SENTRY_DSN: 'https://k@o1.ingest.sentry.io/1', SENTRY_TRACES_SAMPLE_RATE: raw });

    expect(options?.tracesSampleRate).toBe(expected);
  });

  it('switches off cookies, bodies, user info and local variables', () => {
    const { dataCollection } = buildSentryOptions({ SENTRY_DSN: 'https://k@o1.ingest.sentry.io/1' }) ?? {};

    expect(dataCollection).toMatchObject({
      userInfo: false,
      cookies: false,
      httpBodies: [],
      stackFrameVariables: false,
    });
  });
});

describe('scrubEvent', () => {
  it('removes cookies, the request body and sensitive headers but keeps harmless data', () => {
    const event = {
      message: 'boom',
      request: {
        url: '/api/auth/login',
        cookies: { refreshToken: 'secret' },
        data: { email: 'a@mitso.by', password: 'hunter2' },
        headers: { authorization: 'Bearer secret', cookie: 'refreshToken=secret', 'user-agent': 'jest' },
      },
    } as unknown as ErrorEvent;

    const scrubbed = scrubEvent(event);

    expect(JSON.stringify(scrubbed)).not.toMatch(/secret|hunter2/);
    expect(scrubbed.request?.headers).toEqual({ 'user-agent': 'jest' });
    expect(scrubbed.request?.url).toBe('/api/auth/login');
  });

  it('passes an event without a request through', () => {
    const event = { message: 'boom' } as ErrorEvent;

    expect(scrubEvent(event)).toEqual({ message: 'boom' });
  });
});
