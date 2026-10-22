import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '~/entities/user'
import { authApi, type AuthResponse, type LoginDto, type LoginResult } from '../api/authApi'
import { useHttpClient } from '~/shared/api/httpClient'

const SESSION_HINT_KEY = 'mitso:session'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isAuthenticated = computed(() => !!user.value)

  /**
   * "This browser had a session" hint for the login page, so anonymous visitors do not trigger a
   * failing refresh request. Holds no role and grants nothing: access is decided by the httpOnly
   * refresh cookie and the backend (RolesGuard); the role comes from /auth/me.
   */
  function setSessionHint(present: boolean) {
    try {
      if (present) localStorage.setItem(SESSION_HINT_KEY, '1')
      else localStorage.removeItem(SESSION_HINT_KEY)
    } catch {
      // Storage blocked: the login page just always tries to restore
    }
  }

  function hasSessionHint(): boolean {
    try {
      return localStorage.getItem(SESSION_HINT_KEY) !== null
    } catch {
      return true
    }
  }

  /**
   * Login user with credentials
   */
  async function login(credentials: LoginDto): Promise<LoginResult> {
    const response = await authApi.login(credentials)
    // Second factor on: nothing to store yet, the caller shows the code step and calls `completeTwoFactor`
    if ('twoFactorRequired' in response) return response
    await startSession(response)
    return response
  }

  /** Second login step: a code from the authenticator app (or a recovery code) for the challenge from `login` */
  async function completeTwoFactor(challengeToken: string, code: string): Promise<AuthResponse> {
    const response = await authApi.verifyTwoFactor(challengeToken, code)
    await startSession(response)
    return response
  }

  async function startSession(response: AuthResponse) {
    useHttpClient().setAccessToken(response.accessToken)
    // The login response only has id, email and role; pages need the student/teacher profile too
    user.value = await authApi.getMe()
    setSessionHint(true)
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

    setSessionHint(true)
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
    setSessionHint(false)
  }

  return {
    user,
    isAuthenticated,
    login,
    completeTwoFactor,
    restoreSession,
    hasSessionHint,
    logout,
    fetchProfile,
  }
})
