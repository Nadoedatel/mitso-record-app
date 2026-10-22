import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApiClient, payload } from '~/shared/api/apiClient'
import { ApiError } from '~/shared/api/ApiError'
import { HttpClient } from '~/shared/api/httpClient'

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } })

const faculty = { id: 1, name: 'ФИТ', createdAt: '2026-01-01', updatedAt: '2026-01-01' }

describe('typed api client', () => {
  const fetchMock = vi.fn<(input: Request | string) => Promise<Response>>()
  let http: HttpClient

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    http = new HttpClient('http://api/api')
  })
  afterEach(() => vi.unstubAllGlobals())

  const client = () => createApiClient(http, 'http://api/api')

  it('calls the spec path once (the /api prefix is not doubled) with query and bearer token', async () => {
    http.setAccessToken('t1')
    fetchMock.mockResolvedValueOnce(json({ data: [faculty], total: 1, page: 1, limit: 20, totalPages: 1 }))

    const result = await client().GET('/api/faculties', { params: { query: { search: 'ФИ' } } })

    const request = fetchMock.mock.calls[0]![0] as Request
    expect(request.url).toBe(`http://api/api/faculties?search=${encodeURIComponent('ФИ')}`)
    expect(request.headers.get('Authorization')).toBe('Bearer t1')
    expect(request.credentials).toBe('include')
    expect(payload(result).data).toEqual([faculty])
  })

  it('sends a JSON body', async () => {
    fetchMock.mockResolvedValueOnce(json(faculty, 201))

    await client().POST('/api/faculties', { body: { name: 'ФИТ' } })

    const request = fetchMock.mock.calls[0]![0] as Request
    expect(request.method).toBe('POST')
    expect(request.headers.get('Content-Type')).toBe('application/json')
    expect(await request.json()).toEqual({ name: 'ФИТ' })
  })

  it('refreshes the token on 401 and replays the request once', async () => {
    http.setAccessToken('old')
    fetchMock
      .mockResolvedValueOnce(json({ message: 'expired' }, 401))
      .mockResolvedValueOnce(json({ accessToken: 'new' }))
      .mockResolvedValueOnce(json(faculty))

    const result = await client().GET('/api/faculties/{id}', { params: { path: { id: 1 } } })

    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[1]![0]).toBe('http://api/api/auth/refresh')
    expect((fetchMock.mock.calls[2]![0] as Request).headers.get('Authorization')).toBe('Bearer new')
    expect(payload(result).name).toBe('ФИТ')
  })

  it('does not try to refresh on a failed login', async () => {
    fetchMock.mockResolvedValueOnce(json({ message: 'Неверный email или пароль' }, 401))

    await expect(
      client().POST('/api/auth/login', { body: { email: 'a@mitso.by', password: 'x' } }),
    ).rejects.toMatchObject({ message: 'Неверный email или пароль', status: 401 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('throws ApiError with the request id on error responses', async () => {
    fetchMock.mockResolvedValueOnce(json({ message: 'Не найдено' }, 404, { 'x-request-id': 'req-7' }))

    const error = await client()
      .GET('/api/faculties/{id}', { params: { path: { id: 9 } } })
      .catch((err: unknown) => err)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ message: 'Не найдено', status: 404, requestId: 'req-7' })
  })

  it('maps an unreachable server to ApiError status 0', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await expect(client().GET('/api/faculties')).rejects.toMatchObject({ status: 0 })
  })

  it('payload() rejects an empty body', () => {
    expect(() => payload({ data: undefined })).toThrow(ApiError)
  })
})
