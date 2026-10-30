import { expect, test } from '@playwright/test'
import { ANA, addToCart, login } from './helpers'

// Regressão visual com dados estáveis (fixtures determinísticas). Baselines versionadas em e2e/visual.spec.ts-snapshots.
test.describe('Regressão visual @principal', () => {
  test('início', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('#catalogo article')).toHaveCount(9)
    await expect(page).toHaveScreenshot('inicio.png', { fullPage: true })
  })

  test('detalhe', async ({ page }) => {
    await page.goto('/nft/emerald-ape-042')
    await expect(page.getByRole('heading', { name: 'Mais desta coleção' })).toBeVisible()
    await expect(page).toHaveScreenshot('detalhe.png', { fullPage: true })
  })

  test('carrinho e pagamento', async ({ page }) => {
    await addToCart(page, 'emerald-ape-042', 1)
    await expect(page.getByRole('complementary', { name: 'Resumo da carteira' })).toContainText('2.388 ETH')
    await expect(page).toHaveScreenshot('carrinho.png', { fullPage: true })

    await login(page, ANA)
    await page.getByRole('button', { name: 'Conectar e finalizar' }).click()
    await expect(page.getByRole('radio').first()).toBeVisible()
    await expect(page).toHaveScreenshot('pagamento.png', { fullPage: true, mask: [page.getByText(/^@ana$/)] })
  })
})