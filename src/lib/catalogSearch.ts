import {
  CATEGORIES,
  NETWORKS,
  NFT_SORTS,
  NFT_TABS,
  type Category,
  type Network,
  type NftListParams,
  type NftSort,
  type NftTab,
} from '@/types/nft'

export type CatalogSearch = NftListParams

const ETH_PATTERN = /^\d+(\.\d{1,18})?$/

function isOneOf<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (list as readonly string[]).includes(value)
}

function toList<T extends string>(list: readonly T[], value: unknown): T[] | undefined {
  const raw = Array.isArray(value) ? value : value === undefined ? [] : [value]
  const valid = raw.filter((item): item is T => isOneOf(list, item))
  return valid.length > 0 ? [...new Set(valid)] : undefined
}

function toEth(value: unknown): string | undefined {
  const text = typeof value === 'number' ? String(value) : value
  return typeof text === 'string' && ETH_PATTERN.test(text) ? text : undefined
}

export function validateCatalogSearch(search: Record<string, unknown>): CatalogSearch {
  const q = typeof search.q === 'string' && search.q.trim() !== '' ? search.q.trim() : undefined
  const page = Number(search.page)

  return {
    q,
    categories: toList<Category>(CATEGORIES, search.categories),
    networks: toList<Network>(NETWORKS, search.networks),
    minPrice: toEth(search.minPrice),
    maxPrice: toEth(search.maxPrice),
    tab: isOneOf<NftTab>(NFT_TABS, search.tab) && search.tab !== 'todos' ? search.tab : undefined,
    sort: isOneOf<NftSort>(NFT_SORTS, search.sort) && search.sort !== 'recentes' ? search.sort : undefined,
    page: Number.isInteger(page) && page > 1 ? page : undefined,
  }
}