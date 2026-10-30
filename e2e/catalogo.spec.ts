import { expect, test } from '@playwright/test'

test.describe('Catálogo', () => {
  test('busca, filtros combinados, ordenação, paginação e histórico', async ({ page }) => {
    await page.goto('/')
    const cards = page.locator('#catalogo article')
    await expect(cards).toHaveCount(9)

    // Filtros combinados: Música + Ethereum
    await page.getByRole('checkbox', { name: /Música/ }).check({ force: true })
    await page.getByRole('checkbox', { name: /Ethereum/ }).check({ force: true })
    await expect(cards).toHaveCount(1)
    await expect(cards.first()).toContainText('Golden Signal #160')
    await expect(page).toHaveURL(/categories=.*musica.*networks=.*ethereum/)

    // Refresh mantém o estado da URL
    await page.reload()
    await expect(cards).toHaveCount(1)
    await expect(page.getByRole('checkbox', { name: /Música/ })).toBeChecked()

    // Voltar no histórico desfaz o último filtro
    await page.goBack()
    await expect(page.getByRole('checkbox', { name: /Ethereum/ })).not.toBeChecked()
    await expect(cards).toHaveCount(5)

    // Ordenação por menor preço
    await page.goto('/')
    await page.getByLabel('Ordenar por:').selectOption('menor-preco')
    await expect(cards.first()).toContainText('0.02 ETH')

    // Paginação, e mudar filtro volta para a página 1
    await page.getByRole('link', { name: 'Página 2' }).click()
    await expect(page).toHaveURL(/page=2/)
    await page.getByRole('checkbox', { name: /Fotografia/ }).check({ force: true })
    await expect(page).not.toHaveURL(/page=2/)

    // Busca pelo cabeçalho
    await page.getByRole('button', { name: 'Abrir busca' }).click()
    await page.getByLabel('Buscar NFTs').fill('nomad')
    await page.getByLabel('Buscar NFTs').press('Enter')
    await expect(page.getByText('Resultados para')).toContainText('nomad')
    await expect(cards.first()).toContainText('Nomad')
  })

  test('resultado vazio oferece limpar filtros', async ({ page }) => {
    await page.goto('/?q=nao-existe')
    await expect(page.getByText('Nenhum NFT encontrado')).toBeVisible()
    await page.getByRole('link', { name: 'Limpar filtros' }).click()
    await expect(page.locator('#catalogo article')).toHaveCount(9)
  })
})