import { delay, http, HttpResponse } from 'msw'
import { formatEth, parseEth } from '@/lib/eth'
import type { Paginated } from '@/types/api'
import {
  CATEGORIES,
  NETWORKS,
  type Category,
  type Network,
  type Nft,
  type NftFacets,
} from '@/types/nft'
import { db } from '../db'
import { apiError } from '../http'

const PAGE_SIZE = 9
const NEW_SINCE = '2026-10-27T12:00:00.000Z'
const TRENDING_MIN_SCORE = 70

function compareBigInt(a: bigint, b: bigint): number {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

const SORTERS: Record<string, (a: Nft, b: Nft) => number> = {
  recentes: (a, b) => b.listedAt.localeCompare(a.listedAt),
  'menor-preco': (a, b) => compareBigInt(parseEth(a.priceEth), parseEth(b.priceEth)),
  'maior-preco': (a, b) => compareBigInt(parseEth(b.priceEth), parseEth(a.priceEth)),
  populares: (a, b) => b.trendingScore - a.trendingScore,
}

function parsePriceParam(value: string | null): bigint | null | 'invalid' {
  if (value === null || value === '') return null
  try {
    return parseEth(value)
  } catch {
    return 'invalid'
  }
}

export const nftHandlers = [
  http.get('/api/nfts', async ({ request }) => {
    await delay(300)

    const params = new URL(request.url).searchParams
    const q = params.get('q')?.trim().toLowerCase() ?? ''
    const categories = params.getAll('category')
    const networks = params.getAll('network')
    const tab = params.get('tab') ?? 'todos'
    const sort = params.get('sort') ?? 'recentes'
    const page = Number(params.get('page') ?? '1')
    const minPrice = parsePriceParam(params.get('minPrice'))
    const maxPrice = parsePriceParam(params.get('maxPrice'))

    if (minPrice === 'invalid' || maxPrice === 'invalid') {
      return apiError(400, 'VALIDATION', 'Faixa de preço inválida.')
    }
    if (!Number.isInteger(page) || page < 1) {
      return apiError(400, 'VALIDATION', 'Página inválida.')
    }
    const sorter = SORTERS[sort]
    if (!sorter) {
      return apiError(400, 'VALIDATION', `Ordenação desconhecida: ${sort}`)
    }

    const filtered = db.nfts.filter((nft) => {
      const price = parseEth(nft.priceEth)
      if (q && !nft.name.toLowerCase().includes(q) && !nft.collection.toLowerCase().includes(q)) return false
      if (categories.length > 0 && !categories.includes(nft.category)) return false
      if (networks.length > 0 && !networks.includes(nft.network)) return false
      if (minPrice !== null && price < minPrice) return false
      if (maxPrice !== null && price > maxPrice) return false
      if (tab === 'novos' && nft.listedAt < NEW_SINCE) return false
      if (tab === 'em-alta' && nft.trendingScore < TRENDING_MIN_SCORE) return false
      return true
    })

    const sorted = [...filtered].sort(sorter)
    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
    const start = (page - 1) * PAGE_SIZE

    return HttpResponse.json<Paginated<Nft>>({
      items: sorted.slice(start, start + PAGE_SIZE),
      page,
      pageSize: PAGE_SIZE,
      total: sorted.length,
      totalPages,
    })
  }),

  http.get('/api/nfts/facets', async () => {
    await delay(200)
    const categories = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>
    const networks = Object.fromEntries(NETWORKS.map((n) => [n, 0])) as Record<Network, number>
    const prices = db.nfts.map((nft) => parseEth(nft.priceEth))
    for (const nft of db.nfts) {
      categories[nft.category] += 1
      networks[nft.network] += 1
    }
    const min = prices.reduce((a, b) => (b < a ? b : a))
    const max = prices.reduce((a, b) => (b > a ? b : a))
    return HttpResponse.json<NftFacets>({
      categories,
      networks,
      priceRange: { minEth: formatEth(min), maxEth: formatEth(max) },
    })
  }),

  http.get('/api/nfts/:nftId', async ({ params }) => {
    await delay(300)
    const nft = db.nfts.find((item) => item.id === params.nftId)
    if (!nft) {
      return apiError(404, 'NOT_FOUND', 'NFT não encontrado.')
    }
    return HttpResponse.json(nft)
  }),
]