import { delay, http, HttpResponse } from 'msw'
import { db, persistDb, resetDb } from '../db'
import { touchNft } from '../events'
import { apiError } from '../http'
import { dropAllConnections, replayLastEvent, sendStaleNftEvent } from '../realtime'
import { DEFAULT_SCENARIO, extraDelay, getScenario, setScenario } from '../scenarios'

interface NftChangeBody {
  nftId?: string
  priceEth?: string
  edition?: string
  available?: number
}

/**
 * Rotas /api/__mock/* controlam a simulação (painel de cenários e testes).
 * O handler "/api/*" roda antes dos outros e aplica atraso e falhas do cenário;
 * quando não devolve nada, a requisição segue para o handler de verdade.
 */
export const networkHandlers = [
  http.post('/api/__mock/reset', () => {
    resetDb()
    setScenario(DEFAULT_SCENARIO)
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('/api/__mock/expire-sessions', () => {
    db.sessions.forEach((session) => (session.expiresAt = new Date(0).toISOString()))
    persistDb()
    return new HttpResponse(null, { status: 204 })
  }),

  /** Muda preço e/ou estoque de um NFT: a mudança aparece no REST e vira evento nft.updated. */
  http.post('/api/__mock/nft-change', async ({ request }) => {
    const body = (await request.json()) as NftChangeBody
    const nft = db.nfts.find((item) => item.id === body.nftId)
    if (!nft) return apiError(404, 'NOT_FOUND', 'NFT não encontrado.')
    if (body.priceEth) nft.priceEth = body.priceEth
    if (body.edition !== undefined && body.available !== undefined) {
      const edition = nft.editions.find((item) => item.type === body.edition)
      if (edition) edition.available = body.available
    }
    touchNft(nft)
    persistDb()
    return HttpResponse.json(nft)
  }),

  http.post('/api/__mock/realtime/replay', () => new HttpResponse(null, { status: replayLastEvent() ? 204 : 409 })),
  http.post('/api/__mock/realtime/stale', () => new HttpResponse(null, { status: sendStaleNftEvent() ? 204 : 409 })),
  http.post('/api/__mock/realtime/disconnect', () => {
    dropAllConnections()
    return new HttpResponse(null, { status: 204 })
  }),

  http.all('/api/*', async ({ request }) => {
    if (new URL(request.url).pathname.startsWith('/api/__mock/')) return undefined
    const scenario = getScenario()
    const extra = extraDelay(scenario)
    if (extra > 0) await delay(extra)
    if (scenario.failure === 'rede') return HttpResponse.error()
    if (scenario.failure === 'servidor') {
      return apiError(503, 'UNAVAILABLE', 'Serviço temporariamente indisponível. Tente novamente em instantes.')
    }
    return undefined
  }),
]