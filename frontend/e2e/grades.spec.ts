import { expect, test } from '@playwright/test'
import { login, logout } from './helpers'

// Один сценарий через две роли: учитель выставляет оценку, студент её видит
test('учитель выставляет оценку, студент видит её в зачётке', async ({ page }) => {
  await login(page, 'teacher')

  await page.getByLabel('Выберите предмет').selectOption({ label: 'Веб-разработка (WEB101)' })
  await page.getByLabel('Выберите группу').selectOption({ label: 'ИС-21 (2 студентов)' })

  // У Петровой в seed есть экзамен по этому предмету; курсовая новая (уникальность: студент+предмет+тип)
  await page.getByLabel('Тип оценки').selectOption({ label: 'Курсовая' })
  const row = page.getByRole('row').filter({ hasText: 'Петрова' })
  await row.getByRole('spinbutton').fill('7')
  await page.getByRole('button', { name: /Сохранить оценки/ }).click()

  await expect(page.getByRole('status').filter({ hasText: 'Сохранено оценок: 1' })).toBeVisible()
  await expect(row.getByText('Нет оценок')).toHaveCount(0)

  await logout(page)
  await login(page, 'student')

  const gradeRow = page.getByRole('row').filter({ hasText: 'Веб-разработка' }).filter({ hasText: 'Курсовая' })
  await expect(gradeRow).toBeVisible()
  await expect(gradeRow).toContainText('7')
})
