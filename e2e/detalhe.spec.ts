import { expect, test } from '@playwright/test'

test.describe('Detalhe do NFT', () => {
  test('acesso direto, edição esgotada e limite de quantidade @principal', async ({ page }) => {
    await page.goto('/nft/emerald-ape-042')
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()

    // A edição 1/1 deste NFT está esgotada
    await expect(page.getByRole('radio', { name: /1\/1.*esgotada/ })).toBeDisabled()

    // A edição 1/10 tem 10 unidades: o "+" para no limite
    const plus = page.getByRole('button', { name: 'Aumentar quantidade' })
    for (let i = 0; i < 12 && (await plus.isEnabled()); i++) await plus.click()
    await expect(page.getByRole('group', { name: 'Quantidade' }).locator('output')).toHaveText('10')
    await expect(plus).toBeDisabled()
  })

  test('NFT inexistente e rota inexistente', async ({ page }) => {
    await page.goto('/nft/nao-existe')
    await expect(page.getByText('NFT não encontrado')).toBeVisible()

    await page.goto('/rota/que/nao/existe')
    await expect(page.getByText('Página não encontrada')).toBeVisible()
  })
})