import { formatEth, parseEth } from '@/lib/eth'
import type { Cart, Quote, QuoteLine } from '@/types/cart'
import { getSessionUser } from './auth'
import { db } from './db'
import { COUPON_FIXTURES, type CouponRule } from './fixtures/coupons'

const FEE_BASE_ETH = '0.004'
const FEE_PER_LINE_ETH = '0.004'
const QUOTE_TTL_MS = 5 * 60_000

export const GUEST_CART_HEADER = 'X-Guest-Cart'

export function resolveCartKey(request: Request): string | null {
  const current = getSessionUser(request)
  if (current) return `user:${current.user.id}`
  const guestId = request.headers.get(GUEST_CART_HEADER)
  return guestId ? `guest:${guestId}` : null
}

export function getCart(key: string): Cart {
  db.carts[key] ??= { items: [] }
  return db.carts[key]
}

export type CouponCheck = { ok: true; rule: CouponRule } | { ok: false; message: string }

export function checkCoupon(code: string): CouponCheck {
  const rule = COUPON_FIXTURES.find((item) => item.code === code.trim().toUpperCase())
  if (!rule) return { ok: false, message: 'Cupom inválido.' }
  if (new Date(rule.expiresAt).getTime() < Date.now()) return { ok: false, message: 'Este cupom expirou.' }
  return { ok: true, rule }
}

export function buildQuote(cart: Cart): Quote {
  const lines: QuoteLine[] = []
  for (const item of cart.items) {
    const nft = db.nfts.find((candidate) => candidate.id === item.nftId)
    if (!nft) continue
    const edition = nft.editions.find((candidate) => candidate.type === item.edition)
    lines.push({
      ...item,
      nftName: nft.name,
      tokenId: nft.tokenId,
      imageUrl: nft.images[0],
      unitPriceEth: nft.priceEth,
      lineTotalEth: formatEth(parseEth(nft.priceEth) * BigInt(item.quantity)),
      nftVersion: nft.version,
      available: edition?.available ?? 0,
    })
  }

  const subtotal = lines.reduce((total, line) => total + parseEth(line.lineTotalEth), 0n)
  const coupon = cart.couponCode ? checkCoupon(cart.couponCode) : null
  let discount = 0n
  if (coupon?.ok) {
    discount = coupon.rule.percentOff
      ? (subtotal * BigInt(coupon.rule.percentOff)) / 100n
      : parseEth(coupon.rule.amountOffEth ?? '0')
    if (discount > subtotal) discount = subtotal
  }
  const fee = lines.length === 0 ? 0n : parseEth(FEE_BASE_ETH) + parseEth(FEE_PER_LINE_ETH) * BigInt(lines.length)

  return {
    id: `quote-${crypto.randomUUID()}`,
    lines,
    couponCode: coupon?.ok ? coupon.rule.code : undefined,
    subtotalEth: formatEth(subtotal),
    discountEth: formatEth(discount),
    networkFeeEth: formatEth(fee),
    totalEth: formatEth(subtotal - discount + fee),
    expiresAt: new Date(Date.now() + QUOTE_TTL_MS).toISOString(),
  }
}