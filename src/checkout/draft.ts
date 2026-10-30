export interface CheckoutDraft {
  displayName: string
  email: string
  network: string
  note: string
  walletId: string
}

const DRAFT_KEY = 'kurio:checkout-draft'
export const EMPTY_DRAFT: CheckoutDraft = { displayName: '', email: '', network: '', note: '', walletId: '' }

/** O rascunho sobrevive a um refresh e à expiração da sessão no meio do checkout. */
export function loadDraft(): CheckoutDraft {
  try {
    const saved = sessionStorage.getItem(DRAFT_KEY)
    return saved ? { ...EMPTY_DRAFT, ...(JSON.parse(saved) as Partial<CheckoutDraft>) } : EMPTY_DRAFT
  } catch {
    return EMPTY_DRAFT
  }
}

export function saveDraft(draft: CheckoutDraft): void {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  } catch {
    // sem persistência
  }
}

export function clearDraft(): void {
  try {
    sessionStorage.removeItem(DRAFT_KEY)
  } catch {
    // nada a limpar
  }
}