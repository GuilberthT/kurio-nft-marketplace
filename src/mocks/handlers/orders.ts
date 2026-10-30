import { delay, http, HttpResponse } from 'msw'
import { parseEth } from '@/lib/eth'
import type { Order, CreateOrderInput } from '@/types/order'
import type { Wallet } from '@/types/wallet'
import { getSessionUser } from '../auth'
import { buildQuote, getCart } from '../cart'
import { db, persistDb, type OrderRecord } from '../db'
import { apiError } from '../http'
import { hashRequest, scheduleSettlement, settleIfDue, SETTLE_DELAY_MS, toPublicOrder } from '../orders'
import { getScenario, setScenario } from '../scenarios'

export const orderHandlers = [
  http.get('/api/wallets', async ({ request }) => {
    await delay(200)
    const current = getSessionUser(request)
    if (!current) return apiError(401, 'UNAUTHORIZED', 'Sessão inválida ou expirada.')
    return HttpResponse.json<Wallet[]>(db.wallets[current.user.id] ?? [])
  }),

  /** Simula a extensão de carteira pedindo permissão ao usuário. */
  http.post('/api/wallets/:walletId/connect', async ({ request, params }) => {
    await delay(700)
    const current = getSessionUser(request)
    if (!current) return apiError(401, 'UNAUTHORIZED', 'Sessão inválida ou expirada.')
    const wallet = db.wallets[current.user.id]?.find((item) => item.id === params.walletId)
    if (!wallet) return apiError(404, 'NOT_FOUND', 'Carteira não encontrada.')
    if (getScenario().walletRefuse) return apiError(403, 'FORBIDDEN', 'A conexão foi recusada na carteira.')
    return HttpResponse.json({ connected: true, walletId: wallet.id })
  }),

  http.post('/api/orders', async ({ request }) => {
    await delay(600)
    const current = getSessionUser(request)
    if (!current) return apiError(401, 'UNAUTHORIZED', 'Sessão inválida ou expirada.')

    const key = request.headers.get('Idempotency-Key')
    if (!key) return apiError(400, 'VALIDATION', 'Cabeçalho Idempotency-Key é obrigatório.')
    const body = (await request.json()) as CreateOrderInput
    const requestHash = await hashRequest(body)

    // 1. Mesma chave: devolve o MESMO pedido, ou conflito se o conteúdo mudou.
    const existing = db.orders.find((order) => order.userId === current.user.id && order.idempotencyKey === key)
    if (existing) {
      if (existing.requestHash !== requestHash) {
        return apiError(409, 'CONFLICT', 'Esta chave de idempotência já foi usada com outro pedido.')
      }
      settleIfDue(existing)
      return HttpResponse.json<Order>(toPublicOrder(existing))
    }

    // 2. Revalida preço, estoque, cupom e taxas com os dados ATUAIS.
    const wallet = db.wallets[current.user.id]?.find((item) => item.id === body.walletId)
    if (!wallet) return apiError(422, 'VALIDATION', 'Selecione uma carteira cadastrada.', { walletId: 'Selecione uma carteira.' })

    const quote = buildQuote(getCart(`user:${current.user.id}`))
    if (quote.lines.length === 0) return apiError(422, 'VALIDATION', 'Seu carrinho está vazio.')

    const sameLines =
      quote.lines.length === body.expected.lines.length &&
      quote.lines.every((line) =>
        body.expected.lines.some(
          (seen) =>
            seen.nftId === line.nftId &&
            seen.edition === line.edition &&
            seen.quantity === line.quantity &&
            parseEth(seen.unitPriceEth) === parseEth(line.unitPriceEth),
        ),
      )
    const outOfStock = quote.lines.some((line) => line.quantity > line.available)
    if (!sameLines || outOfStock || parseEth(body.expected.totalEth) !== parseEth(quote.totalEth)) {
      return apiError(
        409,
        'STALE_QUOTE',
        outOfStock
          ? 'Uma edição do seu carrinho esgotou. Revise o pedido.'
          : 'Preço, disponibilidade ou taxas mudaram. Revise e confirme novamente.',
      )
    }

    // 3. Cria o pedido pendente e reserva o estoque.
    for (const line of quote.lines) {
      const edition = db.nfts.find((nft) => nft.id === line.nftId)?.editions.find((item) => item.type === line.edition)
      if (edition) edition.available -= line.quantity
    }
    const order: OrderRecord = {
      id: `order-${crypto.randomUUID()}`,
      idempotencyKey: key,
      status: 'pending',
      lines: quote.lines,
      subtotalEth: quote.subtotalEth,
      discountEth: quote.discountEth,
      networkFeeEth: quote.networkFeeEth,
      totalEth: quote.totalEth,
      createdAt: new Date().toISOString(),
      version: 1,
      walletProvider: wallet.provider,
      walletAddress: wallet.address,
      network: body.network,
      userId: current.user.id,
      requestHash,
      settleAt: Date.now() + SETTLE_DELAY_MS,
    }
    db.orders.push(order)
    persistDb()
    scheduleSettlement(order)

    // Cenário de timeout: o pedido foi criado, mas a resposta "se perde" no caminho.
    if (getScenario().orderTimeoutOnce) {
      setScenario({ orderTimeoutOnce: false })
      return HttpResponse.error()
    }
    return HttpResponse.json<Order>(toPublicOrder(order), { status: 201 })
  }),

  http.get('/api/orders/:orderId', async ({ request, params }) => {
    await delay(200)
    const current = getSessionUser(request)
    if (!current) return apiError(401, 'UNAUTHORIZED', 'Sessão inválida ou expirada.')
    // Pedido de outro usuário responde 404: não revela nem que ele existe.
    const order = db.orders.find((item) => item.id === params.orderId && item.userId === current.user.id)
    if (!order) return apiError(404, 'NOT_FOUND', 'Pedido não encontrado.')
    settleIfDue(order)
    return HttpResponse.json<Order>(toPublicOrder(order))
  }),
]