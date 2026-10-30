import type { Nft } from '@/types/nft'

type NftListener = (nft: Nft) => void
const nftListeners = new Set<NftListener>()

export function onNftChange(listener: NftListener): () => void {
  nftListeners.add(listener)
  return () => nftListeners.delete(listener)
}

/** Sobe a versão do NFT e avisa o canal de tempo real. Chamado sempre que preço ou estoque mudam. */
export function touchNft(nft: Nft): void {
  nft.version += 1
  nftListeners.forEach((listener) => listener(nft))
}