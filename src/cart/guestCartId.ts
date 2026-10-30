const GUEST_CART_KEY = 'kurio:guest-cart-id'
let memoryId: string | null = null

export function getGuestCartId(): string {
  try {
    const saved = localStorage.getItem(GUEST_CART_KEY)
    if (saved) return saved
    const created = crypto.randomUUID()
    localStorage.setItem(GUEST_CART_KEY, created)
    return created
  } catch {
    memoryId ??= crypto.randomUUID()
    return memoryId
  }
}