import { delay, http, HttpResponse } from 'msw'
import { getSessionUser } from '../auth'
import { db, persistDb } from '../db'
import { apiError } from '../http'
import { getScenario } from '../scenarios'

export const favoriteHandlers = [
  http.get('/api/favorites', async ({ request }) => {
    await delay(200)
    const current = getSessionUser(request)
    if (!current) return apiError(401, 'UNAUTHORIZED', 'Sessão inválida ou expirada.')
    return HttpResponse.json<string[]>(db.favorites[current.user.id] ?? [])
  }),

  http.put('/api/favorites/:nftId', async ({ request, params }) => {
    await delay(500)
    const current = getSessionUser(request)
    if (!current) return apiError(401, 'UNAUTHORIZED', 'Sessão inválida ou expirada.')
    if (getScenario().favoriteFails) return apiError(503, 'UNAVAILABLE', 'Não foi possível salvar o favorito.')
    const nftId = String(params.nftId)
    if (!db.nfts.some((nft) => nft.id === nftId)) return apiError(404, 'NOT_FOUND', 'NFT não encontrado.')
    const list = new Set(db.favorites[current.user.id] ?? [])
    list.add(nftId)
    db.favorites[current.user.id] = [...list]
    persistDb()
    return HttpResponse.json<string[]>(db.favorites[current.user.id])
  }),

  http.delete('/api/favorites/:nftId', async ({ request, params }) => {
    await delay(500)
    const current = getSessionUser(request)
    if (!current) return apiError(401, 'UNAUTHORIZED', 'Sessão inválida ou expirada.')
    if (getScenario().favoriteFails) return apiError(503, 'UNAVAILABLE', 'Não foi possível remover o favorito.')
    db.favorites[current.user.id] = (db.favorites[current.user.id] ?? []).filter((id) => id !== params.nftId)
    persistDb()
    return HttpResponse.json<string[]>(db.favorites[current.user.id])
  }),
]