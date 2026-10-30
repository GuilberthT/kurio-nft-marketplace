import type { Order } from '@/types/order'
import { getCart } from './cart'
import { db, persistDb, type OrderRecord } from './db'
import { touchNft } from './events'
import { getScenario } from './scenarios'

export const SETTLE_DELAY_MS = 2500

type OrderListener = (order: OrderRecord) => void
const listeners = new Set<OrderListener>()

/** O canal de tempo real se inscreve aqui para avisar quando um pedido muda. */
export function onOrderChange(listener: OrderListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function toPublicOrder({ userId, requestHash, settleAt, ...order }: OrderRecord): Order {
  void userId
  void requestHash
  void settleAt
  return order
}

function fakeTxHash(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(20))
  return `0x${[...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')}`
}

/** Decide o resultado do pagamento. Pedidos confirmados ou recusados não mudam mais. */
export function settleOrder(order: OrderRecord): void {
  if (order.status !== 'pending') return
  const approved = getScenario().payment === 'aprovar'

  if (approved) {
    order.status = 'confirmed'
    order.txHash = fakeTxHash()
    // Sai do carrinho só o que foi comprado, na quantidade comprada.
    const cart = getCart(`user:${order.userId}`)
    for (const line of order.lines) {
      const item = cart.items.find((entry) => entry.nftId === line.nftId && entry.edition === line.edition)
      if (item) item.quantity -= line.quantity
    }
    cart.items = cart.items.filter((item) => item.quantity > 0)
    cart.couponCode = undefined
  } else {
    order.status = 'declined'
    order.declineReason = 'A carteira recusou o pagamento. Nenhum valor foi cobrado.'
    // Devolve o estoque reservado. O carrinho continua intacto.
    for (const line of order.lines) {
       const nft = db.nfts.find((item) => item.id === line.nftId)
      const edition = nft?.editions.find((item) => item.type === line.edition)
      if (nft && edition) {
        edition.available += line.quantity
        touchNft(nft)
      }
    }
  }
  order.version += 1
  persistDb()
  listeners.forEach((listener) => listener(order))
}

/** Depois de um refresh, o timer se perde; por isso o pedido também é resolvido ao ser consultado. */
export function settleIfDue(order: OrderRecord): void {
  if (order.status === 'pending' && Date.now() >= order.settleAt) settleOrder(order)
}

export function scheduleSettlement(order: OrderRecord): void {
  setTimeout(() => settleIfDue(order), SETTLE_DELAY_MS)
}

export async function hashRequest(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value))
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}