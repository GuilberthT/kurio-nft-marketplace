import type { Session, User } from '@/types/user'
import { db, persistDb } from './db'
import type { UserRecord } from './fixtures/users'

export const SESSION_TTL_MS = 30 * 60_000

export async function hashPassword(userId: string, password: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${userId}:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function toPublicUser({ passwordHash, ...user }: UserRecord): User {
  void passwordHash
  return user
}

export function createSession(user: UserRecord): Session {
  const record = {
    token: crypto.randomUUID(),
    userId: user.id,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  }
  db.sessions.push(record)
  persistDb()
  return { token: record.token, expiresAt: record.expiresAt, user: toPublicUser(user) }
}

export function getSessionUser(request: Request): { user: UserRecord; token: string; expiresAt: string } | null {
  const header = request.headers.get('Authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  const session = db.sessions.find((item) => item.token === token)
  if (!session || new Date(session.expiresAt).getTime() <= Date.now()) return null
  const user = db.users.find((item) => item.id === session.userId)
  return user ? { user, token, expiresAt: session.expiresAt } : null
}