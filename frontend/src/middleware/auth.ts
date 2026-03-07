/**
 * Auth middleware - protects routes from unauthorized access
 * Uses userRole cookie (works on SSR and client)
 */
export default defineNuxtRouteMiddleware(async (to) => {
  // Skip middleware for login page
  if (to.path === '/login') {
    return
  }

  // Check role cookie — works on both SSR and client
  const userRole = useCookie('userRole')
  if (!userRole.value) {
    return navigateTo('/login')
  }

  // On client: ensure access token is present, refresh if needed
  if (process.client) {
    const { useHttpClient } = await import('~/shared/api/httpClient')
    const httpClient = useHttpClient()

    if (!httpClient.getAccessToken()) {
      try {
        const { authApi } = await import('~/features/auth/api/authApi')
        const result = await authApi.refresh()
        httpClient.setAccessToken(result.accessToken)
      } catch {
        return navigateTo('/login')
      }
    }
  }
})
