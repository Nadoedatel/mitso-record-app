import { Role } from './types'

const ROLE_LABELS: Record<Role, string> = {
  [Role.STUDENT]: 'Студент',
  [Role.TEACHER]: 'Преподаватель',
  [Role.ADMIN]: 'Администратор',
}

/** Role name for people (the user menu and the like); empty for an unknown value */
export function getRoleLabel(role: Role | string | null | undefined): string {
  return role && Object.hasOwn(ROLE_LABELS, role) ? ROLE_LABELS[role as Role] : ''
}
