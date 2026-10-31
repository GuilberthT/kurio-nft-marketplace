import { expect, test } from '@playwright/test'
import { ANA, login, submitLogin } from './helpers'

// PNG 1×1 válido, usado como avatar.
const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

test.describe('Perfil do colecionador', () => {
  test('rota protegida, edição com conflito, avatar e persistência', async ({ page }) => {
    await page.goto('/conta/perfil')
    await expect(page.getByText('Entre para acessar sua conta')).toBeVisible()
    await login(page, ANA)
    await expect(page).toHaveURL(/\/conta\/perfil$/)

    const username = page.getByLabel('Nome de usuário')
    await expect(username).toHaveValue('ana')

    // Validação local e conflito retornado pela API
    await page.getByLabel('Nome de exibição').fill('')
    await page.getByRole('button', { name: 'Salvar perfil' }).click()
    await expect(page.getByText('Informe o nome de exibição.')).toBeVisible()
    await expect(page.getByLabel('Nome de exibição')).toBeFocused()

    await page.getByLabel('Nome de exibição').fill('Ana Colecionadora')
    await username.fill('bruno')
    await page.getByRole('button', { name: 'Salvar perfil' }).click()
    await expect(page.getByText('Este nome de usuário já está em uso.')).toBeVisible()
    await expect(username).toBeFocused()

    await username.fill('ana_kurio')
    await page.getByRole('button', { name: 'Salvar perfil' }).click()
    await expect(page.getByText('Perfil atualizado.')).toBeVisible()
    await expect(page.getByRole('banner').getByRole('link', { name: 'Minha conta (@ana_kurio)' })).toBeVisible()

    // Avatar: enviar e remover
    await page.getByLabel('Escolher imagem do avatar').setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: PNG_1PX })
    await expect(page.getByText('Avatar atualizado.')).toBeVisible()
    await expect(page.getByRole('img', { name: 'Avatar de Ana Colecionadora' })).toBeVisible()

    // Tudo continua depois do refresh
    await page.reload()
    await expect(page.getByLabel('Nome de usuário')).toHaveValue('ana_kurio')
    await expect(page.getByRole('img', { name: 'Avatar de Ana Colecionadora' })).toBeVisible()

    await page.getByRole('button', { name: 'Remover' }).click()
    await expect(page.getByText('Avatar removido.')).toBeVisible()
  })

  test('alteração de senha com senha atual errada e login com a nova', async ({ page }) => {
    await page.goto('/conta/perfil')
    await login(page, ANA)

    await page.getByLabel('Senha atual').fill('errada123')
    await page.getByLabel('Nova senha', { exact: true }).fill('NovaSenha9')
    await page.getByLabel('Confirmar nova senha').fill('NovaSenha9')
    await page.getByRole('button', { name: 'Alterar senha' }).click()
    await expect(page.getByText('A senha atual está incorreta.')).toBeVisible()
    await expect(page.getByLabel('Senha atual')).toBeFocused()

    await page.getByLabel('Nova senha', { exact: true }).fill('curta')
    await page.getByRole('button', { name: 'Alterar senha' }).click()
    await expect(page.getByText('A senha precisa de pelo menos 8 caracteres.')).toBeVisible()

    await page.getByLabel('Senha atual').fill(ANA.password)
    await page.getByLabel('Nova senha', { exact: true }).fill('NovaSenha9')
    await page.getByLabel('Confirmar nova senha').fill('NovaSenha9')
    await page.getByRole('button', { name: 'Alterar senha' }).click()
    await expect(page.getByText('Senha alterada.')).toBeVisible()

    await page.getByRole('banner').getByRole('button', { name: 'Sair' }).click()
    await page.getByRole('banner').getByRole('button', { name: 'Entrar' }).click()
    await submitLogin(page, { ...ANA, password: 'NovaSenha9' })
  })
})

test.describe('Carteiras', () => {
  test('cadastro da secundária, edição da principal, validação e uso no checkout', async ({ page }) => {
    await page.goto('/conta/carteiras')
    await login(page, { email: 'bruno@kurio.test', password: 'Kurio@456', username: 'bruno' })

    const principal = page.getByRole('form', { name: 'Carteira principal' })
    await expect(principal.getByLabel('Tipo de carteira')).toHaveValue('Coinbase')

    // Cadastrar a secundária com endereço inválido, depois válido
    await page.getByRole('region', { name: 'Carteira secundária' }).getByRole('button', { name: 'Adicionar' }).click()
    const secundaria = page.getByRole('form', { name: 'Carteira secundária' })
    await secundaria.getByRole('button', { name: 'Cadastrar carteira' }).click()
    await expect(secundaria.getByText('Selecione o tipo de carteira.')).toBeVisible()

    await secundaria.getByLabel('Tipo de carteira').selectOption('MetaMask')
    await secundaria.getByLabel('Rede').selectOption('ethereum')
    await secundaria.getByLabel('Endereço da carteira').fill('0x123')
    await secundaria.getByRole('button', { name: 'Cadastrar carteira' }).click()
    await expect(secundaria.getByText(/Endereço inválido/)).toBeVisible()

    await secundaria.getByLabel('Endereço da carteira').fill('0xb0eb53f16947ccf25ec84d8dbc74254770f58904')
    await secundaria.getByRole('button', { name: 'Cadastrar carteira' }).click()
    await expect(page.getByRole('form', { name: 'Carteira secundária' }).getByRole('button', { name: 'Salvar carteira' })).toBeVisible()

    // Editar a principal
    await principal.getByLabel('Tipo de carteira').selectOption('WalletConnect')
    await principal.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(principal.getByText('Carteira atualizada.')).toBeVisible()

    // Persistência e uso no pagamento
    await page.reload()
    await expect(page.getByRole('form', { name: 'Carteira principal' }).getByLabel('Tipo de carteira')).toHaveValue('WalletConnect')
    await page.goto('/nft/sage-nomad-009')
    await page.getByRole('button', { name: 'COMPRAR' }).click()
    await page.getByRole('button', { name: 'Conectar e finalizar' }).click()
    await expect(page.getByRole('radio', { name: /WalletConnect/ })).toBeVisible()
    await expect(page.getByRole('radio', { name: /MetaMask/ })).toBeVisible()
  })
})