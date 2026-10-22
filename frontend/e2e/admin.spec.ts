import { expect, test } from '@playwright/test'
import { login } from './helpers'

test('админ создаёт факультет и видит его в списке', async ({ page }) => {
  await login(page, 'admin')

  await page.getByRole('tab', { name: 'Факультеты' }).click()
  await page.getByRole('button', { name: '+ Добавить факультет' }).click()

  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Название').fill('Факультет e2e')
  await dialog.getByRole('button', { name: 'Создать' }).click()

  await expect(dialog).toBeHidden()
  await expect(page.getByRole('row').filter({ hasText: 'Факультет e2e' })).toBeVisible()
})
