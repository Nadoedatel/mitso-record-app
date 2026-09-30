import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '~/entities/user'
import { authApi, type LoginDto } from '../api/authApi'
import { useHttpClient } from '~/shared/api/httpClient'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isAuthenticated = computed(() => !!user.value)

  /**
   * Mirror the role into a cookie read by route middleware.
   * Client-set on purpose: API and frontend live on different domains in production.
   */
  function syncRoleCookie(role: string | null) {
    const userRole = useCookie('userRole', { sameSite: 'strict', maxAge: 60 * 60 * 24 * 7 })
    userRole.value = role
  }

  /**
   * Login user with credentials
   */
  async function login(credentials: LoginDto) {
    const response = await authApi.login(credentials)
    user.value = response.user
    useHttpClient().setAccessToken(response.accessToken)
    syncRoleCookie(response.user.role)
    return response
  }

  /**
   * Restore session after page reload: refresh access token and load profile.
   * Safe to call repeatedly. Returns false (and cleans local state) if the session is gone.
   */
  async function restoreSession(): Promise<boolean> {
    const httpClient = useHttpClient()

    if (!httpClient.getAccessToken()) {
      const refreshed = await httpClient.refresh()
      if (!refreshed) {
        clearLocalSession()
        return false
      }
    }

    if (!user.value) {
      try {
        user.value = await authApi.getMe()
      } catch {
        clearLocalSession()
        return false
      }
    }

    syncRoleCookie(user.value.role)
    return true
  }

  /**
   * Logout user
   */
  async function logout() {
    try {
      await authApi.logout()
    } catch {
      // Session is dropped locally anyway
    } finally {
      clearLocalSession()
    }
  }

  /**
   * Fetch current user profile with related data
   */
  async function fetchProfile() {
    const profile = await authApi.getMe()
    user.value = profile
    return profile
  }

  function clearLocalSession() {
    user.value = null
    useHttpClient().clearAuth()
    syncRoleCookie(null)
  }

  return {
    user,
    isAuthenticated,
    login,
    restoreSession,
    logout,
    fetchProfile,
  }
})
