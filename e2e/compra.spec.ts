import { expect, test } from '@playwright/test'
import { ANA, addToCart, cartLink, changeScenario, goToReview, login } from './helpers'

test.describe('Compra', () => {
  test('do catálogo ao recibo confirmado @principal', async ({ page }) => {
    await page.goto('/')
    await login(page, ANA)
    await page.locator('#catalogo').getByRole('link', { name: 'Sage Nomad #009' }).click()
    await page.getByRole('button', { name: 'COMPRAR' }).click()
    await expect(page).toHaveURL(/\/carrinho$/)

    // Validação dos campos antes da revisão
    await page.getByRole('button', { name: 'Conectar e finalizar' }).click()
    await page.getByRole('button', { name: 'Revisar e confirmar compra' }).click()
    await expect(page.getByText('Selecione uma rede.')).toBeVisible()
    await expect(page.getByText('Selecione uma carteira.')).toBeVisible()
    await page.goto('/carrinho')

    await goToReview(page)
    await page.getByRole('button', { name: /Confirmar compra de/ }).click()
    await expect(page.getByText('Aguardando confirmação da rede')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible()
    await expect(page.getByText('Sage Nomad #009')).toBeVisible()
    await expect(cartLink(page)).toHaveAccessibleName('Carrinho vazio')

    // O recibo é um retrato do pedido: refresh não muda nada.
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible()
  })

  test('pagamento recusado preserva o carrinho; clique duplo cria um só pedido', async ({ page }) => {
    await page.goto('/')
    await login(page, ANA)
    await changeScenario(page, { payment: 'recusar' })
    await addToCart(page, 'sage-nomad-009')
    await goToReview(page)

    const confirm = page.getByRole('button', { name: /Confirmar compra de/ })
    await confirm.dblclick()
    await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible()
    await expect(cartLink(page)).toHaveAccessibleName('Carrinho, 1 itens')

    const orders = await page.evaluate(() => JSON.parse(localStorage.getItem('kurio:mock-db:v1')!).orders.length)
    expect(orders).toBe(1)
  })

  test('timeout após criar o pedido recupera o mesmo pedido', async ({ page }) => {
    await page.goto('/')
    await login(page, ANA)
    await changeScenario(page, { orderTimeoutOnce: true })
    await addToCart(page, 'sage-nomad-009')
    await goToReview(page)

    await page.getByRole('button', { name: /Confirmar compra de/ }).click()
    await expect(page.getByRole('dialog').getByRole('alert')).toContainText('A conexão caiu antes da resposta')

    await page.getByRole('button', { name: /Confirmar compra de/ }).click()
    await expect(page).toHaveURL(/\/pedido\//)
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible()

    const orders = await page.evaluate(() => JSON.parse(localStorage.getItem('kurio:mock-db:v1')!).orders.length)
    expect(orders).toBe(1)
  })

  test('carteira recusa a conexão', async ({ page }) => {
    await page.goto('/')
    await login(page, ANA)
    await changeScenario(page, { walletRefuse: true })
    await addToCart(page, 'sage-nomad-009')
    await page.getByRole('button', { name: 'Conectar e finalizar' }).click()
    await page.getByRole('radio').first().check()
    await page.getByRole('button', { name: 'Conectar carteira' }).click()
    await expect(page.getByText('A conexão foi recusada na carteira.')).toBeVisible()
  })
})