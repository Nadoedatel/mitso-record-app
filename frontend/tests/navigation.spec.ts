import { describe, expect, it } from 'vitest'
import { getHomeRoute, getRoleLabel } from '~/entities/user'
import {
  ADMIN_SECTIONS,
  getNavItems,
  isNavItemActive,
  navItemLink,
  parseAdminSection,
} from '~/widgets/app-shell/model/navigation'

const itemByLabel = (role: string, label: string) => {
  const item = getNavItems(role).find((entry) => entry.label === label)
  if (!item) throw new Error(`no "${label}" for ${role}`)
  return item
}

describe('side navigation', () => {
  it('every role starts its menu with its home page, an unknown role gets no menu', () => {
    for (const role of ['STUDENT', 'TEACHER', 'ADMIN']) {
      expect(getNavItems(role)[0]?.path).toBe(getHomeRoute(role))
    }
    expect(getNavItems(undefined)).toEqual([])
    expect(getNavItems('GUEST')).toEqual([])
    expect(getNavItems('toString')).toEqual([])
  })

  it('the admin menu holds every admin section, the default one links to plain /admin', () => {
    const items = getNavItems('ADMIN')
    expect(items.map((item) => item.section)).toEqual(ADMIN_SECTIONS.map((section) => section.key))
    expect(navItemLink(items[0]!)).toEqual({ path: '/admin' })
    expect(navItemLink(itemByLabel('ADMIN', 'Факультеты'))).toEqual({ path: '/admin', query: { tab: 'faculties' } })
  })

  it('an unknown or missing ?tab= falls back to the default admin section', () => {
    expect(parseAdminSection(undefined)).toBe('students')
    expect(parseAdminSection(null)).toBe('students')
    expect(parseAdminSection('nope')).toBe('students')
    expect(parseAdminSection('audit')).toBe('audit')
    expect(parseAdminSection(['groups', 'audit'])).toBe('groups')
  })

  it('highlights only the admin section named in the query', () => {
    const students = itemByLabel('ADMIN', 'Студенты')
    const faculties = itemByLabel('ADMIN', 'Факультеты')

    expect(isNavItemActive(students, '/admin', {})).toBe(true)
    expect(isNavItemActive(faculties, '/admin', {})).toBe(false)
    expect(isNavItemActive(faculties, '/admin', { tab: 'faculties' })).toBe(true)
    expect(isNavItemActive(students, '/admin', { tab: 'faculties' })).toBe(false)
  })

  it('nested pages highlight their section, a similar prefix does not', () => {
    const subjects = itemByLabel('TEACHER', 'Мои предметы')
    const students = itemByLabel('TEACHER', 'Студенты')

    expect(isNavItemActive(subjects, '/subjects/3/grades', {})).toBe(true)
    expect(isNavItemActive(students, '/students/12', {})).toBe(true)
    expect(isNavItemActive(students, '/teacher', {})).toBe(false)
    expect(isNavItemActive(itemByLabel('STUDENT', 'Зачётка'), '/students', {})).toBe(false)
  })

  it('names roles for people', () => {
    expect(getRoleLabel('TEACHER')).toBe('Преподаватель')
    expect(getRoleLabel(undefined)).toBe('')
    expect(getRoleLabel('constructor')).toBe('')
  })
})
