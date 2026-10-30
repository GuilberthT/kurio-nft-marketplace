import type { Paginated } from '@/types/api'
import type { Nft, NftFacets, NftListParams } from '@/types/nft'
import { httpClient } from './httpClient'

export async function fetchNfts(params: NftListParams, signal?: AbortSignal): Promise<Paginated<Nft>> {
  const { categories, networks, ...rest } = params
  const { data } = await httpClient.get<Paginated<Nft>>('/nfts', {
    params: { ...rest, category: categories, network: networks },
    signal,
  })
  return data
}

export async function fetchNftFacets(signal?: AbortSignal): Promise<NftFacets> {
  const { data } = await httpClient.get<NftFacets>('/nfts/facets', { signal })
  return data
}

export async function fetchNft(nftId: string, signal?: AbortSignal): Promise<Nft> {
  const { data } = await httpClient.get<Nft>(`/nfts/${encodeURIComponent(nftId)}`, { signal })
  return data
}