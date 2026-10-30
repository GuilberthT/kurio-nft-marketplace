const ATTEMPT_KEY = 'kurio:checkout-attempt'

interface Attempt {
  key: string
  signature: string
}

/**
 * Mesma compra (mesmo conteúdo) = mesma chave, mesmo depois de um refresh ou de um timeout.
 * Conteúdo diferente (ex.: preço mudou e o usuário confirmou de novo) = chave nova.
 */
export function getIdempotencyKey(payload: unknown): string {
  const signature = JSON.stringify(payload)
  try {
    const saved = sessionStorage.getItem(ATTEMPT_KEY)
    const attempt = saved ? (JSON.parse(saved) as Attempt) : null
    if (attempt?.signature === signature) return attempt.key
    const next: Attempt = { key: crypto.randomUUID(), signature }
    sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify(next))
    return next.key
  } catch {
    return crypto.randomUUID()
  }
}

export function clearIdempotencyKey(): void {
  try {
    sessionStorage.removeItem(ATTEMPT_KEY)
  } catch {
    // nada a limpar
  }
}