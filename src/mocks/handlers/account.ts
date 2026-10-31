import { delay, http, HttpResponse } from 'msw'
import { validateWalletAddress } from '@/lib/walletAddress'
import { NETWORKS, type Network } from '@/types/nft'
import type { User } from '@/types/user'
import { WALLET_KINDS, WALLET_PROVIDERS, type Wallet, type WalletInput } from '@/types/wallet'
import { getSessionUser, hashPassword, toPublicUser } from '../auth'
import { db, persistDb } from '../db'
import { apiError } from '../http'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/
const MAX_AVATAR_LENGTH = 300_000

interface ProfileBody {
  name?: string
  username?: string
  email?: string
}

function isOneOf<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (list as readonly string[]).includes(value)
}

/** Valida uma carteira. Devolve os erros por campo (vazio = válida). */
function walletErrors(body: Partial<WalletInput>): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!isOneOf(WALLET_PROVIDERS, body.provider)) errors.provider = 'Selecione o tipo de carteira.'
  if (!isOneOf(NETWORKS, body.network)) errors.network = 'Selecione uma rede.'
  else {
    const addressError = validateWalletAddress(body.network as Network, body.address ?? '')
    if (addressError) errors.address = addressError
  }
  return errors
}

export const accountHandlers = [
  http.get('/api/profile', async ({ request }) => {
    await delay(200)
    const current = getSessionUser(request)
    if (!current) return apiError(401, 'UNAUTHORIZED', 'Sessão inválida ou expirada.')
    return HttpResponse.json<User>(toPublicUser(current.user))
  }),

  http.patch('/api/profile', async ({ request }) => {
    await delay(400)
    const current = getSessionUser(request)
    if (!current) return apiError(401, 'UNAUTHORIZED', 'Sessão inválida ou expirada.')
    const body = (await request.json()) as ProfileBody
    const name = body.name?.trim() ?? ''
    const username = body.username?.trim().toLowerCase() ?? ''
    const email = body.email?.trim().toLowerCase() ?? ''

    const fieldErrors: Record<string, string> = {}
    if (name.length < 2) fieldErrors.name = 'Informe o nome de exibição.'
    if (!USERNAME_PATTERN.test(username)) fieldErrors.username = 'Use de 3 a 20 letras minúsculas, números ou _.'
    if (!EMAIL_PATTERN.test(email)) fieldErrors.email = 'Informe um e-mail válido.'
    const others = db.users.filter((user) => user.id !== current.user.id)
    if (!fieldErrors.username && others.some((user) => user.username === username)) {
      fieldErrors.username = 'Este nome de usuário já está em uso.'
    }
    if (!fieldErrors.email && others.some((user) => user.email === email)) {
      fieldErrors.email = 'Este e-mail já está cadastrado.'
    }
    if (Object.keys(fieldErrors).length > 0) {
      const conflict = fieldErrors.username?.includes('uso') || fieldErrors.email?.includes('cadastrado')
      return apiError(conflict ? 409 : 400, conflict ? 'CONFLICT' : 'VALIDATION', 'Confira os campos destacados.', fieldErrors)
    }

    Object.assign(current.user, { name, username, email })
    persistDb()
    return HttpResponse.json<User>(toPublicUser(current.user))
  }),

  http.put('/api/profile/avatar', async ({ request }) => {
    await delay(500)
    const current = getSessionUser(request)
    if (!current) return apiError(401, 'UNAUTHORIZED', 'Sessão inválida ou expirada.')
    const { dataUrl = '' } = (await request.json()) as { dataUrl?: string }
    if (!/^data:image\/(png|jpeg|webp);base64,/.test(dataUrl)) {
      return apiError(400, 'VALIDATION', 'Envie uma imagem PNG, JPG ou WebP.', { avatar: 'Formato não suportado.' })
    }
    if (dataUrl.length > MAX_AVATAR_LENGTH) {
      return apiError(400, 'VALIDATION', 'A imagem é grande demais.', { avatar: 'A imagem é grande demais.' })
    }
    current.user.avatarUrl = dataUrl
    persistDb()
    return HttpResponse.json<User>(toPublicUser(current.user))
  }),

  http.delete('/api/profile/avatar', async ({ request }) => {
    await delay(300)
    const current = getSessionUser(request)
    if (!current) return apiError(401, 'UNAUTHORIZED', 'Sessão inválida ou expirada.')
    delete current.user.avatarUrl
    persistDb()
    return HttpResponse.json<User>(toPublicUser(current.user))
  }),

  http.post('/api/profile/password', async ({ request }) => {
    await delay(500)
    const current = getSessionUser(request)
    if (!current) return apiError(401, 'UNAUTHORIZED', 'Sessão inválida ou expirada.')
    const { currentPassword = '', newPassword = '' } = (await request.json()) as {
      currentPassword?: string
      newPassword?: string
    }
    if ((await hashPassword(current.user.id, currentPassword)) !== current.user.passwordHash) {
      return apiError(422, 'VALIDATION', 'A senha atual está incorreta.', { currentPassword: 'A senha atual está incorreta.' })
    }
    if (newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      return apiError(400, 'VALIDATION', 'Senha fraca.', { newPassword: 'Use pelo menos 8 caracteres, com letras e números.' })
    }
    if (newPassword === currentPassword) {
      return apiError(400, 'VALIDATION', 'A nova senha precisa ser diferente.', { newPassword: 'A nova senha precisa ser diferente da atual.' })
    }
    current.user.passwordHash = await hashPassword(current.user.id, newPassword)
    persistDb()
    return new HttpResponse(null, { status: 204 })
  }),

  /** Cada usuário tem no máximo uma carteira principal e uma secundária. */
  http.post('/api/wallets', async ({ request }) => {
    await delay(400)
    const current = getSessionUser(request)
    if (!current) return apiError(401, 'UNAUTHORIZED', 'Sessão inválida ou expirada.')
    const body = (await request.json()) as Partial<WalletInput>
    if (!isOneOf(WALLET_KINDS, body.kind)) return apiError(400, 'VALIDATION', 'Tipo de carteira inválido.')
    const fieldErrors = walletErrors(body)
    if (Object.keys(fieldErrors).length > 0) return apiError(400, 'VALIDATION', 'Confira os campos destacados.', fieldErrors)

    const list = (db.wallets[current.user.id] ??= [])
    if (list.some((wallet) => wallet.kind === body.kind)) {
      return apiError(409, 'CONFLICT', `Você já tem uma carteira ${body.kind === 'principal' ? 'principal' : 'secundária'}.`)
    }
    if (list.some((wallet) => wallet.address.toLowerCase() === body.address!.trim().toLowerCase())) {
      return apiError(409, 'CONFLICT', 'Esta carteira já está cadastrada.', { address: 'Esta carteira já está cadastrada.' })
    }
    const wallet: Wallet = {
      id: `wallet-${crypto.randomUUID()}`,
      kind: body.kind,
      provider: body.provider!,
      network: body.network!,
      address: body.address!.trim(),
    }
    list.push(wallet)
    persistDb()
    return HttpResponse.json<Wallet>(wallet, { status: 201 })
  }),

  http.patch('/api/wallets/:walletId', async ({ request, params }) => {
    await delay(400)
    const current = getSessionUser(request)
    if (!current) return apiError(401, 'UNAUTHORIZED', 'Sessão inválida ou expirada.')
    const list = db.wallets[current.user.id] ?? []
    const wallet = list.find((item) => item.id === params.walletId)
    if (!wallet) return apiError(404, 'NOT_FOUND', 'Carteira não encontrada.')
    const body = (await request.json()) as Partial<WalletInput>
    const fieldErrors = walletErrors(body)
    if (Object.keys(fieldErrors).length > 0) return apiError(400, 'VALIDATION', 'Confira os campos destacados.', fieldErrors)
    const address = body.address!.trim()
    if (list.some((item) => item.id !== wallet.id && item.address.toLowerCase() === address.toLowerCase())) {
      return apiError(409, 'CONFLICT', 'Esta carteira já está cadastrada.', { address: 'Esta carteira já está cadastrada.' })
    }
    Object.assign(wallet, { provider: body.provider, network: body.network, address })
    persistDb()
    return HttpResponse.json<Wallet>(wallet)
  }),
]