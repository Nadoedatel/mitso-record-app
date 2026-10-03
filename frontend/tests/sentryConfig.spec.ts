import { describe, expect, it } from 'vitest'
import type { Breadcrumb, ErrorEvent } from '@sentry/vue'
import { buildSentryOptions, scrubBreadcrumb, scrubEvent, stripQuery } from '~/shared/lib/sentryConfig'

describe('buildSentryOptions', () => {
  it('is disabled without a DSN', () => {
    expect(buildSentryOptions()).toBeUndefined()
    expect(buildSentryOptions({})).toBeUndefined()
    expect(buildSentryOptions({ dsn: '' })).toBeUndefined()
  })

  it('builds options from the runtime config', () => {
    const options = buildSentryOptions({ dsn: 'https://k@o1.ingest.sentry.io/2', environment: 'production', release: 'abc123' })

    expect(options).toMatchObject({
      dsn: 'https://k@o1.ingest.sentry.io/2',
      environment: 'production',
      release: 'abc123',
      tracesSampleRate: 0,
    })
  })

  it('leaves the release undefined when it is an empty string', () => {
    expect(buildSentryOptions({ dsn: 'https://k@o1.ingest.sentry.io/2', release: '' })?.release).toBeUndefined()
  })

  it.each([
    [0.25, 0.25],
    ['0.5', 0.5],
    [5, 1],
    [-1, 0],
    ['abc', 0],
  ])('clamps tracesSampleRate %s to %d', (raw, expected) => {
    expect(buildSentryOptions({ dsn: 'https://k@o1.ingest.sentry.io/2', tracesSampleRate: raw })?.tracesSampleRate).toBe(expected)
  })

  it('turns off every kind of personal data collection', () => {
    const { dataCollection } = buildSentryOptions({ dsn: 'https://k@o1.ingest.sentry.io/2' }) ?? {}

    expect(dataCollection).toEqual({
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
    })
  })
})

describe('stripQuery', () => {
  it.each([
    ['/students?search=Иванов', '/students'],
    ['https://api/x?page=2#top', 'https://api/x'],
    ['/students#section', '/students'],
    ['/students', '/students'],
  ])('%s -> %s', (input, expected) => {
    expect(stripQuery(input)).toBe(expected)
  })
})

describe('scrubEvent', () => {
  it('removes cookies, body, query string and sensitive headers', () => {
    const event = {
      message: 'boom',
      request: {
        url: 'https://app/students?search=Иванов',
        query_string: 'search=Иванов',
        cookies: { userRole: 'ADMIN' },
        data: { password: 'hunter2' },
        headers: { Authorization: 'Bearer secret', Cookie: 'a=b', 'User-Agent': 'jest' },
      },
    } as unknown as ErrorEvent

    const scrubbed = scrubEvent(event)

    expect(JSON.stringify(scrubbed)).not.toMatch(/Иванов|hunter2|secret|userRole/)
    expect(scrubbed.request?.url).toBe('https://app/students')
    expect(scrubbed.request?.headers).toEqual({ 'User-Agent': 'jest' })
  })

  it('passes an event without a request through', () => {
    expect(scrubEvent({ message: 'boom' } as ErrorEvent)).toEqual({ message: 'boom' })
  })
})

describe('scrubBreadcrumb', () => {
  it('drops console breadcrumbs', () => {
    expect(scrubBreadcrumb({ category: 'console', message: JSON.stringify({ name: 'Иван' }) } as Breadcrumb)).toBeNull()
  })

  it.each(['fetch', 'xhr'])('strips the query string of %s breadcrumbs', (category) => {
    const crumb = scrubBreadcrumb({ category, data: { url: 'http://api/students?search=Иванов', status_code: 200 } })

    expect(crumb?.data).toEqual({ url: 'http://api/students', status_code: 200 })
  })

  it('keeps other breadcrumbs untouched', () => {
    const click = { category: 'ui.click', message: 'button.save' }

    expect(scrubBreadcrumb({ ...click })).toEqual(click)
  })
})
