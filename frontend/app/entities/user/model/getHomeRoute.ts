import { Role } from './types'

/**
 * Landing page for a role. Single source of truth for post-login and "home" redirects.
 */
export function getHomeRoute(role: Role | string | null | undefined): string {
  if (role === Role.ADMIN) return '/admin'
  if (role === Role.TEACHER) return '/teacher'
  if (role === Role.STUDENT) return '/student'
  return '/login'
}
