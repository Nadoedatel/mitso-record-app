/**
 * Auth middleware - protects routes from unauthorized access
 * Checks if user is authenticated, if not redirects to /login
 */
export default defineNuxtRouteMiddleware(async (to) => {
  // Skip middleware for login page
  if (to.path === '/login') {
    return
  }

  // Check if running on client side
  if (process.client) {
    const { useHttpClient } = await import('~/shared/api/httpClient')
    const httpClient = useHttpClient()
    const accessToken = httpClient.getAccessToken()

    // If no access token, redirect to login
    if (!accessToken) {
      return navigateTo('/login')
    }
  }
})
