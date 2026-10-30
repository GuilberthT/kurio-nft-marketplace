import { delay, http, HttpResponse } from 'msw'
import type { Session } from '@/types/user'
import { createSession, getSessionUser, hashPassword, toPublicUser } from '../auth'
import { db, persistDb } from '../db'
import { apiError } from '../http'

interface LoginBody {
  email?: string
  password?: string
}

interface RegisterBody extends LoginBody {
  username?: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/

export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    await delay(400)
    const body = (await request.json()) as LoginBody
    const email = body.email?.trim().toLowerCase() ?? ''
    const user = db.users.find((item) => item.email === email)
    const hash = user ? await hashPassword(user.id, body.password ?? '') : ''

    if (!user || hash !== user.passwordHash) {
      return apiError(401, 'UNAUTHORIZED', 'E-mail ou senha incorretos.')
    }
    return HttpResponse.json<Session>(createSession(user))
  }),

  http.post('/api/auth/register', async ({ request }) => {
    await delay(500)
    const body = (await request.json()) as RegisterBody
    const username = body.username?.trim().toLowerCase() ?? ''
    const email = body.email?.trim().toLowerCase() ?? ''
    const password = body.password ?? ''

    const fieldErrors: Record<string, string> = {}
    if (!USERNAME_PATTERN.test(username)) fieldErrors.username = 'Use de 3 a 20 letras minúsculas, números ou _.'
    if (!EMAIL_PATTERN.test(email)) fieldErrors.email = 'Informe um e-mail válido.'
    if (password.length < 8) fieldErrors.password = 'A senha precisa de pelo menos 8 caracteres.'
    if (Object.keys(fieldErrors).length > 0) {
      return apiError(400, 'VALIDATION', 'Confira os campos destacados.', fieldErrors)
    }

    if (db.users.some((item) => item.email === email)) {
      return apiError(409, 'CONFLICT', 'Já existe uma conta com este e-mail.', { email: 'Este e-mail já está cadastrado.' })
    }
    if (db.users.some((item) => item.username === username)) {
      return apiError(409, 'CONFLICT', 'Este nome de usuário já está em uso.', { username: 'Escolha outro nome de usuário.' })
    }

    const id = `user-${crypto.randomUUID()}`
    const user = { id, name: username, username, email, passwordHash: await hashPassword(id, password) }
    db.users.push(user)
    persistDb()
    return HttpResponse.json<Session>(createSession(user), { status: 201 })
  }),

  http.get('/api/auth/session', async ({ request }) => {
    await delay(150)
    const current = getSessionUser(request)
    if (!current) return apiError(401, 'UNAUTHORIZED', 'Sessão inválida ou expirada.')
    return HttpResponse.json<Session>({
      token: current.token,
      expiresAt: current.expiresAt,
      user: toPublicUser(current.user),
    })
  }),

  http.post('/api/auth/logout', async ({ request }) => {
    await delay(150)
    const current = getSessionUser(request)
    if (current) {
      db.sessions = db.sessions.filter((item) => item.token !== current.token)
      persistDb()
    }
    return new HttpResponse(null, { status: 204 })
  }),
]