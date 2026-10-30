import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { fetchNft, fetchNftFacets, fetchNfts } from '@/api/nfts'
import type { NftListParams } from '@/types/nft'

export const nftKeys = {
  all: ['nfts'] as const,
  lists: () => [...nftKeys.all, 'list'] as const,
  list: (params: NftListParams) => [...nftKeys.lists(), params] as const,
  facets: () => [...nftKeys.all, 'facets'] as const,
  detail: (nftId: string) => [...nftKeys.all, 'detail', nftId] as const,
}

export function nftListQuery(params: NftListParams) {
  return queryOptions({
    queryKey: nftKeys.list(params),
    queryFn: ({ signal }) => fetchNfts(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function nftFacetsQuery() {
  return queryOptions({
    queryKey: nftKeys.facets(),
    queryFn: ({ signal }) => fetchNftFacets(signal),
    staleTime: 5 * 60_000,
  })
}

export function nftDetailQuery(nftId: string) {
  return queryOptions({
    queryKey: nftKeys.detail(nftId),
    queryFn: ({ signal }) => fetchNft(nftId, signal),
  })
}