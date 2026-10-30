import { delay, http, HttpResponse } from 'msw'
import type { Quote } from '@/types/cart'
import { EDITION_TYPES, type EditionType } from '@/types/nft'
import { getSessionUser } from '../auth'
import { buildQuote, checkCoupon, getCart, resolveCartKey } from '../cart'
import { db, persistDb } from '../db'
import { apiError } from '../http'

interface ItemBody {
  nftId?: string
  edition?: string
  quantity?: number
}

function isEdition(value: unknown): value is EditionType {
  return typeof value === 'string' && (EDITION_TYPES as readonly string[]).includes(value)
}

function checkItem(nftId: string | undefined, edition: unknown, quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 0) {
    return apiError(400, 'VALIDATION', 'Quantidade inválida.')
  }
  const nft = db.nfts.find((item) => item.id === nftId)
  if (!nft) return apiError(404, 'NOT_FOUND', 'NFT não encontrado.')
  if (!isEdition(edition)) return apiError(400, 'VALIDATION', 'Edição inválida.')
  const available = nft.editions.find((item) => item.type === edition)?.available ?? 0
  if (quantity > available) {
    return apiError(
      409,
      'CONFLICT',
      available === 0 ? 'Esta edição está esgotada.' : `Só há ${available} unidade(s) disponível(is) desta edição.`,
    )
  }
  return null
}

function respond(key: string, status = 200) {
  persistDb()
  return HttpResponse.json<Quote>(buildQuote(getCart(key)), { status })
}

export const cartHandlers = [
  http.get('/api/cart', async ({ request }) => {
    await delay(250)
    const key = resolveCartKey(request)
    if (!key) return apiError(400, 'VALIDATION', 'Carrinho não identificado.')
    return HttpResponse.json<Quote>(buildQuote(getCart(key)))
  }),

  http.post('/api/cart/items', async ({ request }) => {
    await delay(300)
    const key = resolveCartKey(request)
    if (!key) return apiError(400, 'VALIDATION', 'Carrinho não identificado.')
    const body = (await request.json()) as ItemBody
    const cart = getCart(key)
    const existing = cart.items.find((item) => item.nftId === body.nftId && item.edition === body.edition)
    const nextQuantity = (existing?.quantity ?? 0) + (body.quantity ?? 1)

    const problem = checkItem(body.nftId, body.edition, nextQuantity)
    if (problem) return problem

    if (existing) existing.quantity = nextQuantity
    else cart.items.push({ nftId: body.nftId!, edition: body.edition as EditionType, quantity: nextQuantity })
    return respond(key, 201)
  }),

  http.patch('/api/cart/items', async ({ request }) => {
    await delay(250)
    const key = resolveCartKey(request)
    if (!key) return apiError(400, 'VALIDATION', 'Carrinho não identificado.')
    const body = (await request.json()) as ItemBody
    const cart = getCart(key)
    const existing = cart.items.find((item) => item.nftId === body.nftId && item.edition === body.edition)
    if (!existing) return apiError(404, 'NOT_FOUND', 'Item não está no carrinho.')

    const problem = checkItem(body.nftId, body.edition, body.quantity ?? 0)
    if (problem) return problem

    existing.quantity = body.quantity ?? 0
    cart.items = cart.items.filter((item) => item.quantity > 0)
    return respond(key)
  }),

  http.delete('/api/cart/items', async ({ request }) => {
    await delay(250)
    const key = resolveCartKey(request)
    if (!key) return apiError(400, 'VALIDATION', 'Carrinho não identificado.')
    const params = new URL(request.url).searchParams
    const cart = getCart(key)
    cart.items = cart.items.filter(
      (item) => !(item.nftId === params.get('nftId') && item.edition === params.get('edition')),
    )
    return respond(key)
  }),

  http.post('/api/cart/coupon', async ({ request }) => {
    await delay(350)
    const key = resolveCartKey(request)
    if (!key) return apiError(400, 'VALIDATION', 'Carrinho não identificado.')
    const { code = '' } = (await request.json()) as { code?: string }
    const result = checkCoupon(code)
    if (!result.ok) return apiError(422, 'VALIDATION', result.message, { code: result.message })
    getCart(key).couponCode = result.rule.code
    return respond(key)
  }),

  http.delete('/api/cart/coupon', async ({ request }) => {
    await delay(250)
    const key = resolveCartKey(request)
    if (!key) return apiError(400, 'VALIDATION', 'Carrinho não identificado.')
    getCart(key).couponCode = undefined
    return respond(key)
  }),

  http.post('/api/cart/merge', async ({ request }) => {
    await delay(250)
    const current = getSessionUser(request)
    if (!current) return apiError(401, 'UNAUTHORIZED', 'Sessão inválida ou expirada.')
    const { guestCartId } = (await request.json()) as { guestCartId?: string }
    const userKey = `user:${current.user.id}`
    const guestKey = `guest:${guestCartId}`
    const guest = db.carts[guestKey]
    const cart = getCart(userKey)

    for (const item of guest?.items ?? []) {
      const available =
        db.nfts.find((nft) => nft.id === item.nftId)?.editions.find((edition) => edition.type === item.edition)
          ?.available ?? 0
      const existing = cart.items.find((line) => line.nftId === item.nftId && line.edition === item.edition)
      const merged = Math.min((existing?.quantity ?? 0) + item.quantity, available)
      if (merged <= 0) continue
      if (existing) existing.quantity = merged
      else cart.items.push({ ...item, quantity: merged })
    }
    if (guest?.couponCode && !cart.couponCode) cart.couponCode = guest.couponCode
    delete db.carts[guestKey]
    return respond(userKey)
  }),
]