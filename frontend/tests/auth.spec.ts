import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const httpClient = vi.hoisted(() => ({
  getAccessToken: vi.fn<() => string | null>(),
  setAccessToken: vi.fn(),
  clearAuth: vi.fn(),
  refresh: vi.fn<() => Promise<boolean>>(),
}))
const authApi = vi.hoisted(() => ({ login: vi.fn(), getMe: vi.fn(), logout: vi.fn() }))

vi.mock('~/shared/api/httpClient', () => ({ useHttpClient: () => httpClient }))
vi.mock('~/features/auth/api/authApi', () => ({ authApi }))

import { useAuthStore } from '~/features/auth/model/useAuth'

const admin = { id: 1, email: 'admin@mitso.by', role: 'ADMIN' }

describe('auth store', () => {
  const roleCookie = { value: null as string | null }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    roleCookie.value = null
    vi.stubGlobal('useCookie', () => roleCookie)
  })

  it('restores the session after reload: refresh token, then profile, then role cookie', async () => {
    httpClient.getAccessToken.mockReturnValue(null)
    httpClient.refresh.mockResolvedValue(true)
    authApi.getMe.mockResolvedValue(admin)

    const store = useAuthStore()
    expect(await store.restoreSession()).toBe(true)

    expect(httpClient.refresh).toHaveBeenCalledTimes(1)
    expect(store.user).toEqual(admin)
    expect(roleCookie.value).toBe('ADMIN')
  })

  it('does not refresh again when a token is already in memory and the user is loaded', async () => {
    httpClient.getAccessToken.mockReturnValue('token')
    authApi.getMe.mockResolvedValue(admin)

    const store = useAuthStore()
    await store.restoreSession()
    await store.restoreSession()

    expect(httpClient.refresh).not.toHaveBeenCalled()
    expect(authApi.getMe).toHaveBeenCalledTimes(1)
  })

  it('clears local state and the role cookie when the refresh token is gone', async () => {
    httpClient.getAccessToken.mockReturnValue(null)
    httpClient.refresh.mockResolvedValue(false)
    roleCookie.value = 'ADMIN'

    const store = useAuthStore()
    expect(await store.restoreSession()).toBe(false)

    expect(store.user).toBeNull()
    expect(roleCookie.value).toBeNull()
    expect(httpClient.clearAuth).toHaveBeenCalled()
  })

  it('logout clears local state even if the request fails', async () => {
    authApi.logout.mockRejectedValue(new Error('network'))
    const store = useAuthStore()
    store.user = admin as never

    await store.logout()

    expect(store.user).toBeNull()
    expect(httpClient.clearAuth).toHaveBeenCalled()
  })
})
