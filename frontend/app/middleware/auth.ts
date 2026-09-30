import { useAuthStore } from '~/features/auth/model/useAuth'

/**
 * Auth middleware - protects routes from unauthorized access.
 * Restores the session (refresh token + profile), so F5 keeps the user logged in.
 * The app is client-only (ssr: false), so this always runs in the browser.
 */
export default defineNuxtRouteMiddleware(async () => {
  const authStore = useAuthStore()

  if (!(await authStore.restoreSession())) {
    return navigateTo('/login')
  }
})
