import { expect, test } from '@playwright/test'
import { changeScenario, useScenario } from './helpers'

test.describe('Acessibilidade e estados', () => {
  test('teclado: modal de login prende o foco e fecha com Esc', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('#catalogo article')).toHaveCount(9)
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeFocused()

    const entrar = page.getByRole('banner').getByRole('button', { name: 'Entrar' })
    await entrar.focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab')
      expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true)
    }

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(entrar).toBeFocused()
  })

  test('skeletons em carregamento lento, erro e recuperação', async ({ page }) => {
    await useScenario(page, { latency: 'lenta', failure: 'servidor' })
    await page.goto('/')
    await expect(page.locator('#catalogo .skeleton').first()).toBeVisible()
    await expect(page.getByText('Não foi possível carregar os NFTs')).toBeVisible({ timeout: 20_000 })

    await changeScenario(page, { latency: 'normal', failure: 'nenhuma' })
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.locator('#catalogo article')).toHaveCount(9)
  })
})