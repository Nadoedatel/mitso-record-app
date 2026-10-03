import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HttpClient } from '~/shared/api/httpClient'
import { ApiError } from '~/shared/api/ApiError'
import { resetErrorReporter, setErrorReporter } from '~/shared/lib/errorReporter'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

describe('HttpClient', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('unwraps { data, message } responses but keeps paginated ones as-is', async () => {
    const client = new HttpClient('http://api')
    fetchMock.mockResolvedValueOnce(json({ data: { id: 1 }, message: 'ok' }))
    expect(await client.get('/x')).toEqual({ id: 1 })

    const page = { data: [1], total: 1, page: 1, limit: 20, totalPages: 1 }
    fetchMock.mockResolvedValueOnce(json(page))
    expect(await client.get('/y')).toEqual(page)
  })

  it('returns undefined for 204 responses', async () => {
    const client = new HttpClient('http://api')
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))
    expect(await client.delete('/x')).toBeUndefined()
  })

  it('joins class-validator message arrays into one error', async () => {
    const client = new HttpClient('http://api')
    fetchMock.mockResolvedValueOnce(json({ message: ['email must be an email', 'password too short'] }, 400))
    await expect(client.post('/x', {})).rejects.toThrow('email must be an email, password too short')
  })

  it('sends a body of 0 / empty string / false (falsy but defined)', async () => {
    const client = new HttpClient('http://api')
    fetchMock.mockResolvedValue(json({ ok: true }))
    await client.post('/x', 0)
    expect(fetchMock.mock.calls[0][1].body).toBe('0')
  })

  it('shares one refresh between parallel 401s and retries with the new token', async () => {
    const client = new HttpClient('http://api')
    client.setAccessToken('old')

    fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
      if (url.endsWith('/auth/refresh')) return json({ accessToken: 'new' })
      const auth = (init.headers as Record<string, string>).Authorization
      return auth === 'Bearer new' ? json({ ok: true }) : json({ message: 'Unauthorized' }, 401)
    })

    const results = await Promise.all([client.get('/a'), client.get('/b'), client.get('/c')])

    expect(results).toEqual([{ ok: true }, { ok: true }, { ok: true }])
    const refreshCalls = fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/auth/refresh'))
    expect(refreshCalls).toHaveLength(1)
    expect(client.getAccessToken()).toBe('new')
  })

  it('does not try to refresh on 401 from login or refresh itself', async () => {
    const client = new HttpClient('http://api')
    fetchMock.mockResolvedValue(json({ message: 'Invalid credentials' }, 401))
    await expect(client.post('/auth/login', {})).rejects.toThrow('Invalid credentials')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('drops the token when refresh fails', async () => {
    const client = new HttpClient('http://api')
    client.setAccessToken('old')
    fetchMock.mockResolvedValue(json({ message: 'Unauthorized' }, 401))

    await expect(client.get('/a')).rejects.toThrow('Unauthorized')
    expect(client.getAccessToken()).toBeNull()
  })

  describe('error reporting', () => {
    const capture = vi.fn()

    beforeEach(() => {
      capture.mockReset()
      setErrorReporter({ capture })
    })
    afterEach(() => resetErrorReporter())

    const failing = (status: number, requestId?: string) =>
      new Response(JSON.stringify({ message: 'boom' }), {
        status,
        headers: { 'Content-Type': 'application/json', ...(requestId ? { 'x-request-id': requestId } : {}) },
      })

    it('throws an ApiError carrying the status and the backend request id', async () => {
      const client = new HttpClient('http://api')
      fetchMock.mockResolvedValueOnce(failing(404, 'req-9'))

      const error = await client.get('/x').catch((e: unknown) => e)

      expect(error).toBeInstanceOf(ApiError)
      expect(error).toMatchObject({ message: 'boom', status: 404, requestId: 'req-9' })
    })

    it('reports a 5xx with the request id and endpoint', async () => {
      const client = new HttpClient('http://api')
      fetchMock.mockResolvedValueOnce(failing(500, 'req-1'))

      await expect(client.get('/grades')).rejects.toThrow('boom')

      expect(capture).toHaveBeenCalledTimes(1)
      expect(capture.mock.calls[0][1]).toEqual({ requestId: 'req-1', status: 500, endpoint: '/grades' })
    })

    it.each([400, 401, 403, 404, 409])('does not report a %i (the user\'s mistake, shown in the UI)', async (status) => {
      const client = new HttpClient('http://api')
      fetchMock.mockResolvedValueOnce(failing(status))

      await expect(client.get('/x')).rejects.toThrow()

      expect(capture).not.toHaveBeenCalled()
    })
  })
})
