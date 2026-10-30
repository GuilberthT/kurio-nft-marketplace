import { expect, test } from '@playwright/test'
import { ANA, BRUNO, addToCart, cartLink, login, mockControl, submitLogin } from './helpers'

test.describe('Conta e sessão', () => {
  test('cadastro com conflito, cadastro válido e sessão após refresh', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('banner').getByRole('button', { name: 'Entrar' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: 'Criar conta' }).first().click()

    // Validação local
    await dialog.getByRole('button', { name: 'Criar conta' }).last().click()
    await expect(dialog.getByText('Informe seu e-mail.')).toBeVisible()

    // Conflito retornado pela API, mostrado no campo certo
    await dialog.getByPlaceholder('Nome de usuário').fill('carla')
    await dialog.getByPlaceholder('Digite seu e-mail').fill(ANA.email)
    await dialog.getByPlaceholder('Senha', { exact: true }).fill('senha1234')
    await dialog.getByPlaceholder('Confirmar senha').fill('senha1234')
    await dialog.getByRole('button', { name: 'Criar conta' }).last().click()
    await expect(dialog.getByText('Este e-mail já está cadastrado.')).toBeVisible()
    await expect(dialog.getByPlaceholder('Digite seu e-mail')).toBeFocused()

    await dialog.getByPlaceholder('Digite seu e-mail').fill('carla@kurio.test')
    await dialog.getByRole('button', { name: 'Criar conta' }).last().click()
    await expect(page.getByRole('banner').getByText('@carla')).toBeAttached()

    await page.reload()
    await expect(page.getByRole('banner').getByText('@carla')).toBeAttached()
  })

  test('login errado, troca de usuário sem vazar dados e logout', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('banner').getByRole('button', { name: 'Entrar' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByPlaceholder('contato@email.com').fill(ANA.email)
    await dialog.getByPlaceholder('Senha').fill('errada123')
    await dialog.getByRole('button', { name: 'Entrar', exact: true }).last().click()
    await expect(dialog.getByRole('alert')).toHaveText('E-mail ou senha incorretos.')
    await page.keyboard.press('Escape')

    await login(page, ANA)
    await addToCart(page, 'sage-nomad-009')
    await expect(cartLink(page)).toHaveAccessibleName('Carrinho, 1 itens')

    await page.getByRole('button', { name: 'Sair' }).click()
    await expect(cartLink(page)).toHaveAccessibleName('Carrinho vazio')

    await login(page, BRUNO)
    await expect(cartLink(page)).toHaveAccessibleName('Carrinho vazio')
    await page.goto('/carrinho')
    await expect(page.getByText('Seu carrinho está vazio')).toBeVisible()
  })

  test('sessão expira durante o checkout e o contexto é mantido', async ({ page }) => {
    await page.goto('/')
    await login(page, ANA)
    await addToCart(page, 'sage-nomad-009')
    await page.getByRole('button', { name: 'Conectar e finalizar' }).click()
    await page.getByLabel('Observação do colecionador (opcional)').fill('Presente de aniversário')
    await expect(page.getByRole('radio').first()).toBeVisible()

    await mockControl(page, 'expire-sessions')
    // A próxima chamada autenticada recebe 401: o app pede login sem sair da tela.
    await page.getByRole('radio').first().check()
    await page.getByRole('button', { name: 'Conectar carteira' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText(/Sua sessão expirou/)).toBeVisible()
    await expect(page).toHaveURL(/\/pagamento$/)
    await submitLogin(page, ANA)
    await expect(page.getByLabel('Observação do colecionador (opcional)')).toHaveValue('Presente de aniversário')
    await expect(page.getByText('Sage Nomad #009')).toBeVisible()
  })
})