import { httpClient } from './httpClient'

export async function fetchFavorites(signal?: AbortSignal): Promise<string[]> {
  const { data } = await httpClient.get<string[]>('/favorites', { signal })
  return data
}

export async function addFavorite(nftId: string): Promise<string[]> {
  const { data } = await httpClient.put<string[]>(`/favorites/${encodeURIComponent(nftId)}`)
  return data
}

export async function removeFavorite(nftId: string): Promise<string[]> {
  const { data } = await httpClient.delete<string[]>(`/favorites/${encodeURIComponent(nftId)}`)
  return data
}