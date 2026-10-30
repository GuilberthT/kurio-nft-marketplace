import { expect, type Page } from '@playwright/test'

export const ANA = { email: 'ana@kurio.test', password: 'Kurio@123', username: 'ana' }
export const BRUNO = { email: 'bruno@kurio.test', password: 'Kurio@456', username: 'bruno' }

type Scenario = Partial<{
  latency: 'normal' | 'lenta' | 'variavel'
  failure: 'nenhuma' | 'rede' | 'servidor'
  payment: 'aprovar' | 'recusar'
  walletRefuse: boolean
  orderTimeoutOnce: boolean
  favoriteFails: boolean
}>

/** Grava o cenário antes de a página carregar. Cada teste começa com um navegador limpo. */
export async function useScenario(page: Page, scenario: Scenario) {
  await page.addInitScript((value) => {
    if (!sessionStorage.getItem('e2e:scenario-set')) {
      localStorage.setItem('kurio:mock-scenario', value)
      sessionStorage.setItem('e2e:scenario-set', '1')
    }
  }, JSON.stringify(scenario))
}

/** Muda o cenário no meio do teste (sem recarregar a página). */
export async function changeScenario(page: Page, scenario: Scenario) {
  await page.evaluate((value) => {
    const current = JSON.parse(localStorage.getItem('kurio:mock-scenario') ?? '{}')
    localStorage.setItem('kurio:mock-scenario', JSON.stringify({ ...current, ...value }))
  }, scenario)
}

/** Chama o "controle remoto" da simulação. Passa pelo MSW, como qualquer requisição do app. */
export async function mockControl(page: Page, path: string, body?: unknown) {
  const status = await page.evaluate(
    async ([url, payload]) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload ? JSON.stringify(payload) : undefined,
      })
      return response.status
    },
    [`/api/__mock/${path}`, body] as const,
  )
  expect(status).toBeLessThan(300)
}

export async function login(page: Page, user = ANA) {
  await page.getByRole('banner').getByRole('button', { name: 'Entrar' }).click()
  await submitLogin(page, user)
}

/** Preenche o modal de login que já está aberto. */
export async function submitLogin(page: Page, user = ANA) {
  const dialog = page.getByRole('dialog')
  await dialog.getByPlaceholder('contato@email.com').fill(user.email)
  await dialog.getByPlaceholder('Senha').fill(user.password)
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).last().click()
  // No celular o @usuario fica escondido; o botão "Sair" aparece em todas as larguras.
  await expect(page.getByRole('banner').getByRole('button', { name: 'Sair' })).toBeVisible()
  await expect(page.getByRole('banner').getByText(`@${user.username}`)).toBeAttached()
}

export async function addToCart(page: Page, nftId: string, extraUnits = 0) {
  await page.goto(`/nft/${nftId}`)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  for (let i = 0; i < extraUnits; i++) await page.getByRole('button', { name: 'Aumentar quantidade' }).click()
  await page.getByRole('button', { name: 'COMPRAR' }).click()
  await expect(page).toHaveURL(/\/carrinho$/)
}

/** Do carrinho até o modal de revisão, com carteira conectada. */
export async function goToReview(page: Page) {
  await page.getByRole('button', { name: 'Conectar e finalizar' }).click()
  await expect(page).toHaveURL(/\/pagamento$/)
  await page.getByLabel('Rede').selectOption('ethereum')
  await page.getByRole('radio').first().check()
  await page.getByRole('button', { name: 'Conectar carteira' }).click()
  await expect(page.getByText(/conectada$/)).toBeVisible()
  await page.getByRole('button', { name: 'Revisar e confirmar compra' }).click()
  await expect(page.getByRole('dialog', { name: 'Revise seu pedido' })).toBeVisible()
}

export const cartLink = (page: Page) => page.getByRole('banner').getByRole('link', { name: /Carrinho/ })