import type { Category, Network, NftSort, NftTab } from '@/types/nft'

export const CATEGORY_LABELS: Record<Category, string> = {
  'arte-digital': 'Arte digital',
  fotografia: 'Fotografia',
  musica: 'Música',
  'arte-3d': 'Arte 3D',
  colecionaveis: 'Colecionáveis',
  generativa: 'Generativa',
  jogos: 'Jogos',
  assinaturas: 'Assinaturas',
  utilidade: 'Utilidade',
}

export const NETWORK_LABELS: Record<Network, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}

export const TAB_LABELS: Record<NftTab, string> = {
  todos: 'Todos os NFTs',
  novos: 'Novos lançamentos',
  'em-alta': 'Em alta',
}

export const SORT_LABELS: Record<NftSort, string> = {
  recentes: 'Listados recentemente',
  'menor-preco': 'Menor preço',
  'maior-preco': 'Maior preço',
  populares: 'Mais populares',
}