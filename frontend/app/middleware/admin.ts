import { useAuthStore } from '~/features/auth/model/useAuth'
import { getHomeRoute } from '~/entities/user'

/**
 * Admin middleware - role check only. Use after `auth`:
 * definePageMeta({ middleware: ['auth', 'admin'] })
 */
export default defineNuxtRouteMiddleware(() => {
  const role = useAuthStore().user?.role

  if (role !== 'ADMIN') {
    return navigateTo(getHomeRoute(role))
  }
})
