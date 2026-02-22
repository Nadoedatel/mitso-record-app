/**
 * Admin middleware - protects admin routes
 * Checks if user is authenticated and has ADMIN role
 * Redirects to /login if not authenticated
 * Redirects to / if not ADMIN
 */
export default defineNuxtRouteMiddleware(async () => {
  // Check if running on client side
  if (process.client) {
    const { useHttpClient } = await import('~/shared/api/httpClient')
    const httpClient = useHttpClient()
    const accessToken = httpClient.getAccessToken()

    // If no access token, redirect to login
    if (!accessToken) {
      return navigateTo('/login')
    }

    // Get user role from token or user data
    const userData = httpClient.getUserData()

    // Check if user has ADMIN role
    if (userData?.role !== 'ADMIN') {
      return navigateTo('/')
    }
  }
})
