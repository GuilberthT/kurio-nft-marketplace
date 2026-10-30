import { expect, test } from '@playwright/test'
import { ANA, addToCart, cartLink, login, useScenario } from './helpers'

test.describe('Carrinho', () => {
  test('quantidades, remoção, cupons e persistência após refresh e login', async ({ page }) => {
    await addToCart(page, 'emerald-ape-042', 1)
    await expect(cartLink(page)).toHaveAccessibleName('Carrinho, 2 itens')
    const summary = page.getByRole('complementary', { name: 'Resumo da carteira' })
    await expect(summary).toContainText('2.38 ETH')

    // Cupom inválido, expirado e válido
    await page.getByLabel('Código promocional').fill('XPTO')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByText('Cupom inválido.')).toBeVisible()
    await page.getByLabel('Código promocional').fill('EXPIRADO')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(page.getByText('Este cupom expirou.')).toBeVisible()
    await page.getByLabel('Código promocional').fill('KURIO10')
    await page.getByRole('button', { name: 'Aplicar' }).click()
    await expect(summary).toContainText('(-) 0.238 ETH')
    await expect(summary).toContainText('2.15 ETH')

    // Visitante recarrega: continua tudo lá
    await page.reload()
    await expect(page.getByText('Emerald Ape #042')).toBeVisible()
    await expect(summary).toContainText('KURIO10')

    // Ao entrar, os itens do visitante vão para a conta
    await login(page, ANA)
    await expect(cartLink(page)).toHaveAccessibleName('Carrinho, 2 itens')

    // Diminuir e remover
    await page.getByRole('group', { name: /Quantidade de Emerald/ }).getByRole('button', { name: 'Diminuir quantidade' }).click()
    await expect(cartLink(page)).toHaveAccessibleName('Carrinho, 1 itens')
    await page.getByRole('button', { name: 'Remover Emerald Ape #042 do carrinho' }).click()
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
  })
})

test.describe('Favoritos', () => {
  test('favorito otimista com rollback na falha e persistência', async ({ page }) => {
    await useScenario(page, { favoriteFails: true })
    await page.goto('/nft/sage-nomad-009')
    await login(page, ANA)

    const button = page.getByRole('button', { name: /Favorit/ })
    await button.click()
    // Atualização otimista: muda antes da resposta...
    await expect(button).toHaveAttribute('aria-pressed', 'true')
    // ...e volta quando a API falha.
    await expect(button).toHaveAttribute('aria-pressed', 'false')
    await expect(page.getByText(/voltou ao estado anterior/)).toBeVisible()

    // Sem falha, o favorito é salvo e sobrevive ao refresh.
    await page.evaluate(() => localStorage.setItem('kurio:mock-scenario', '{}'))
    await button.click()
    await expect(button).toHaveAttribute('aria-pressed', 'true')
    await expect(button).toBeEnabled() // espera a API responder antes de recarregar
    await page.reload()
    await expect(page.getByRole('button', { name: 'Favoritado' })).toHaveAttribute('aria-pressed', 'true')
  })
})