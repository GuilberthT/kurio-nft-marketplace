export type EthAmount = string

export const CATEGORIES = [
    'arte-digital', 'fotografia', 'musica','arte-3d', 'colecionaveis', 'generativa', 'jogos', 'assinaturas', 'utilidade',
] as const 
export type Category = (typeof CATEGORIES)[number]

export const NETWORKS = ['ethereum', 'polygon', 'solana'] as const
export type Network = (typeof NETWORKS)[number]

export const EDITION_TYPES = ['1/1', '1/10', '1/50', 'aberta'] as const
export type EditionType = (typeof EDITION_TYPES)[number]

export interface NftEdition {
    type: EditionType
    available: number
}

export interface Nft {
    id: string
    tokenId: string
    name: string
    collection: string
    category: Category
    network: Network
    description: string
    attributes: string[]
    images: string[]
    priceEth: EthAmount
    compareAtPriceEth?: EthAmount
    editions: NftEdition[]
    rating: number
    reviewCount: number
    listedAt: string
    trendingScore: number
    version: number
}

export const NFT_TABS = ['todos', 'novos', 'em-alta'] as const
export type NftTab = (typeof NFT_TABS)[number]

export const NFT_SORTS = ['recentes', 'menor-preco', 'maior-preco', 'populares'] as const
export type NftSort = (typeof NFT_SORTS)[number]

export interface NftListParams {
  q?: string
  categories?: Category[]
  networks?: Network[]
  minPrice?: EthAmount
  maxPrice?: EthAmount
  tab?: NftTab
  sort?: NftSort
  page?: number
}

export interface NftFacets {
  categories: Record<Category, number>
  networks: Record<Network, number>
  priceRange: { minEth: EthAmount; maxEth: EthAmount }
}