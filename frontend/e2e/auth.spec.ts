import { expect, test } from '@playwright/test'
import { login, logout, PASSWORD, USERS } from './helpers'

test.describe('auth', () => {
  test('закрытая страница без сессии ведёт на /login', async ({ page }) => {
    await page.goto('/student')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('неверный пароль: ошибка и остаёмся на /login', async ({ page }) => {
    await page.goto('/login')
    // Несуществующий аккаунт: не блокируем seed-пользователей счётчиком неудачных входов
    await page.getByLabel('Email').fill('nobody@mitso.by')
    await page.getByLabel('Пароль').fill(PASSWORD)
    await page.getByRole('button', { name: 'Войти' }).click()

    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('студент: вход, сессия переживает перезагрузку, выход', async ({ page }) => {
    await login(page, 'student')
    await expect(page.getByRole('heading', { name: /Петрова/ })).toBeVisible()

    // F5: access-токен в памяти пропал, сессия восстанавливается по refresh-cookie
    await page.reload()
    await expect(page).toHaveURL(/\/student$/)
    await expect(page.getByRole('heading', { name: /Петрова/ })).toBeVisible()

    await logout(page)
    await page.goto('/student')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('студент не попадает в админку', async ({ page }) => {
    await login(page, 'student')
    // goto перезагружает страницу: restoreSession берёт refresh-cookie
    await page.goto('/admin')
    await expect(page).toHaveURL(new RegExp(`${USERS.student.home}$`))
  })
})
