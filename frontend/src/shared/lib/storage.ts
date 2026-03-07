/**
 * Local storage utilities with type safety
 */

const STORAGE_KEYS = {
  USER_ROLE: 'mitso_user_role',
} as const

export const storage = {
  getUserRole(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(STORAGE_KEYS.USER_ROLE)
  },

  setUserRole(role: string) {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEYS.USER_ROLE, role)
  },

  removeUserRole() {
    if (typeof window === 'undefined') return
    localStorage.removeItem(STORAGE_KEYS.USER_ROLE)
  },

  clear() {
    if (typeof window === 'undefined') return
    localStorage.removeItem('mitso_access_token')
    localStorage.removeItem('mitso_user_data')
    localStorage.removeItem('mitso_user_role')
  },
}
