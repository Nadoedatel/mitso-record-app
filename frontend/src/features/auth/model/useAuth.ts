import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '~/entities/user'
import { authApi, type LoginDto, type RegisterDto } from '../api/authApi'
import { useHttpClient } from '~/shared/api/httpClient'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(null)
  const isAuthenticated = computed(() => !!accessToken.value)

  /**
   * Login user with credentials
   */
  async function login(credentials: LoginDto) {
    try {
      const response = await authApi.login(credentials)
      user.value = response.user
      accessToken.value = response.accessToken

      // Set token in HTTP client
      const httpClient = useHttpClient()
      httpClient.setAccessToken(response.accessToken)

      // Set userRole cookie for middleware (auth.ts / admin.ts)
      const userRole = useCookie('userRole')
      userRole.value = response.user.role

      return response
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  /**
   * Register new user
   */
  async function register(data: RegisterDto) {
    try {
      const response = await authApi.register(data)
      user.value = response.user
      accessToken.value = response.accessToken

      // Set token in HTTP client
      const httpClient = useHttpClient()
      httpClient.setAccessToken(response.accessToken)

      // Set userRole cookie for middleware
      const userRole = useCookie('userRole')
      userRole.value = response.user.role

      return response
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    }
  }

  /**
   * Logout user
   */
  async function logout() {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      user.value = null
      accessToken.value = null

      // Clear all auth data from HTTP client
      const httpClient = useHttpClient()
      httpClient.clearAuth()

      // Clear userRole cookie
      const userRole = useCookie('userRole')
      userRole.value = null

      // Clear local storage
      const { storage } = await import('~/shared/lib/storage')
      storage.clear()
    }
  }

  /**
   * Fetch current user profile with related data
   */
  async function fetchProfile() {
    try {
      const profile = await authApi.getMe()
      user.value = profile
      return profile
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      throw error
    }
  }

  /**
   * Set user and token (after successful auth or refresh)
   */
  function setAuth(userData: User, token: string) {
    user.value = userData
    accessToken.value = token

    const httpClient = useHttpClient()
    httpClient.setAccessToken(token)

    // Sync userRole cookie for middleware
    const userRole = useCookie('userRole')
    userRole.value = userData.role
  }

  return {
    user,
    accessToken,
    isAuthenticated,
    login,
    register,
    logout,
    fetchProfile,
    setAuth,
  }
})
