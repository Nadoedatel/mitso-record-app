import type { LocationQuery, LocationQueryRaw } from 'vue-router'
import { Role } from '~/entities/user'
import type { IconName } from '~/shared/ui'

/** Sections of the admin page, picked by `?tab=`; the first one is the default (plain `/admin`) */
export const ADMIN_SECTIONS = [
  { key: 'students', label: 'Студенты', icon: 'graduation-cap' },
  { key: 'teachers', label: 'Преподаватели', icon: 'user' },
  { key: 'subjects', label: 'Дисциплины', icon: 'book' },
  { key: 'groups', label: 'Группы', icon: 'users' },
  { key: 'faculties', label: 'Факультеты', icon: 'building' },
  { key: 'specializations', label: 'Специализации', icon: 'layers' },
  { key: 'audit', label: 'Журнал', icon: 'history' },
] as const satisfies readonly { key: string; label: string; icon: IconName }[]

export type AdminSection = (typeof ADMIN_SECTIONS)[number]['key']

const DEFAULT_ADMIN_SECTION: AdminSection = ADMIN_SECTIONS[0].key

/** The section named in `?tab=`, or the default one for a missing or unknown value */
export function parseAdminSection(tab: LocationQuery[string] | undefined): AdminSection {
  const value = Array.isArray(tab) ? tab[0] : tab
  return ADMIN_SECTIONS.find((section) => section.key === value)?.key ?? DEFAULT_ADMIN_SECTION
}

export interface NavItem {
  label: string
  icon: IconName
  /** Page the item opens */
  path: string
  /** Admin section the item opens (`?tab=`) */
  section?: AdminSection
  /** Nested pages that belong to the item: with `/subjects`, `/subjects/3/grades` highlights it */
  nested?: string[]
}

const ADMIN_PATH = '/admin'

const NAV_ITEMS: Record<Role, NavItem[]> = {
  [Role.STUDENT]: [{ label: 'Зачётка', icon: 'notebook', path: '/student' }],
  [Role.TEACHER]: [
    { label: 'Мои предметы', icon: 'book', path: '/teacher', nested: ['/subjects'] },
    { label: 'Студенты', icon: 'graduation-cap', path: '/students' },
  ],
  [Role.ADMIN]: ADMIN_SECTIONS.map(({ key, label, icon }) => ({ label, icon, path: ADMIN_PATH, section: key })),
}

/** Sections of the side navigation for a role; none for an unknown role (no user yet) */
export function getNavItems(role: Role | string | null | undefined): NavItem[] {
  return role && Object.hasOwn(NAV_ITEMS, role) ? NAV_ITEMS[role as Role] : []
}

/** Router location of an item; the default admin section stays plain `/admin` (the home route of the role) */
export function navItemLink(item: NavItem): { path: string; query?: LocationQueryRaw } {
  if (!item.section || item.section === DEFAULT_ADMIN_SECTION) return { path: item.path }
  return { path: item.path, query: { tab: item.section } }
}

const isWithin = (path: string, base: string) => path === base || path.startsWith(`${base}/`)

/** Whether the current route is this item's page (or one of its nested pages) */
export function isNavItemActive(item: NavItem, path: string, query: LocationQuery): boolean {
  if (item.section) return path === item.path && parseAdminSection(query.tab) === item.section
  return [item.path, ...(item.nested ?? [])].some((base) => isWithin(path, base))
}
