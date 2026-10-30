import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { nftDetailQuery } from '@/queries/nfts'

const route = getRouteApi('/nft/$nftId')

/** Versão provisória: a tela completa vem na próxima parte. */
export function NftDetailPage() {
  const { nftId } = route.useParams()
  const nft = useQuery(nftDetailQuery(nftId))

  if (nft.isPending) return <p className="py-10">Carregando…</p>
  if (nft.isError) return <p className="py-10">{nft.error.message}</p>
  return <h1 className="py-10 text-3xl font-bold">{nft.data.name}</h1>
}