const TOKEN_KEY = 'kurio:session-token'

export const SESSION_EXPIRED_EVENT = 'kurio:session-expired'

export function getSessionToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setSessionToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // sem localStorage: a sessão dura só enquanto a aba estiver aberta
  }
}

export function clearSessionToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // nada a limpar
  }
}