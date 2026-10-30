import { expect, test } from '@playwright/test'
import { ANA, addToCart, goToReview, login, mockControl } from './helpers'

test.describe('Tempo real (Socket.IO)', () => {
  test('preço muda durante o checkout e exige nova confirmação @principal', async ({ page }) => {
    await page.goto('/')
    await login(page, ANA)
    await addToCart(page, 'emerald-ape-042')

    // nft.updated chega pelo socket.io-client e atualiza o resumo
    await mockControl(page, 'nft-change', { nftId: 'emerald-ape-042', priceEth: '1.49' })
    await expect(page.getByText(/mudou de preço ou disponibilidade/)).toBeVisible()
    const summary = page.getByRole('complementary', { name: 'Resumo da carteira' })
    await expect(summary).toContainText('1.498 ETH')

    await goToReview(page)
    const dialog = page.getByRole('dialog', { name: 'Revise seu pedido' })
    await mockControl(page, 'nft-change', { nftId: 'emerald-ape-042', priceEth: '1.69' })
    await expect(dialog.getByRole('alert')).toContainText('Os valores do pedido mudaram')
    await expect(dialog.getByRole('button', { name: 'Confirmar compra de 1.698 ETH' })).toBeVisible()
  })

  test('ignora eventos duplicados e antigos', async ({ page }) => {
    await page.goto('/nft/emerald-ape-042')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.waitForTimeout(500) // garante o socket conectado

    await mockControl(page, 'nft-change', { nftId: 'emerald-ape-042', priceEth: '1.59' })
    const price = page.getByRole('main').getByText(/^1\.59 ETH/)
    await expect(price).toBeVisible()

    await mockControl(page, 'realtime/replay')
    await mockControl(page, 'realtime/stale') // traz preço 0.01 com versão antiga
    await page.waitForTimeout(800)
    await expect(price).toBeVisible()
    await expect(page.getByRole('main').getByText(/^0\.01 ETH/)).toHaveCount(0)
  })

  test('queda de conexão com pedido pendente: recupera sem nova compra', async ({ page }) => {
    await page.goto('/')
    await login(page, ANA)
    await addToCart(page, 'sage-nomad-009')
    await goToReview(page)
    await page.getByRole('button', { name: /Confirmar compra de/ }).click()
    await expect(page.getByText('Aguardando confirmação da rede')).toBeVisible()

    await mockControl(page, 'realtime/disconnect')
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' })).toBeVisible()
    const orders = await page.evaluate(() => JSON.parse(localStorage.getItem('kurio:mock-db:v1')!).orders.length)
    expect(orders).toBe(1)
  })
})