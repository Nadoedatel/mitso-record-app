import { expect, type Page } from '@playwright/test'

/** Accounts created by backend/prisma/seed.ts (all share one password) */
export const PASSWORD = 'password123'
export const USERS = {
  admin: { email: 'admin@mitso.by', home: '/admin' },
  teacher: { email: 'kozlov@mitso.by', home: '/teacher' },
  student: { email: 'petrova@mitso.by', home: '/student' },
} as const

export type Role = keyof typeof USERS

/**
 * Logs in through the login form and waits for the role's home page.
 * Keep the number of calls small: POST /auth/login allows 10 per minute per IP.
 */
export async function login(page: Page, role: Role): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('Email').fill(USERS[role].email)
  await page.getByLabel('Пароль').fill(PASSWORD)
  await page.getByRole('button', { name: 'Войти' }).click()
  await expect(page).toHaveURL(new RegExp(`${USERS[role].home}$`))
}

/** Signs out through the user menu at the bottom of the side panel (desktop width) */
export async function logout(page: Page): Promise<void> {
  await page.getByRole('button', { name: /меню пользователя/ }).click()
  await page.getByRole('menuitem', { name: 'Выйти' }).click()
  await expect(page).toHaveURL(/\/login$/)
}
