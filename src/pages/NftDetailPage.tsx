import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import { Star } from 'lucide-react'
import { ApiError } from '@/api/httpClient'
import { useAddToCart } from '@/cart/useCart'
import { NftCard } from '@/components/catalog/NftCard'
import { Skeleton } from '@/components/feedback/Skeleton'
import { StatePanel } from '@/components/feedback/StatePanel'
import { EditionPicker } from '@/components/nft/EditionPicker'
import { NftGallery } from '@/components/nft/NftGallery'
import { QuantityStepper } from '@/components/nft/QuantityStepper'
import { Button, buttonVariants } from '@/components/ui/button'
import { NETWORK_LABELS } from '@/lib/labels'
import { nftDetailQuery, nftListQuery } from '@/queries/nfts'
import type { EditionType, Nft } from '@/types/nft'
import { FavoriteButton } from '@/components/nft/FavoriteButton'

const route = getRouteApi('/nft/$nftId')

export function NftDetailPage() {
  const { nftId } = route.useParams()
  const nft = useQuery(nftDetailQuery(nftId))

  if (nft.isPending) return <NftDetailSkeleton />

  if (nft.isError) {
    const notFound = nft.error instanceof ApiError && nft.error.code === 'NOT_FOUND'
    return (
      <div className="py-16">
        <StatePanel
          role="alert"
          title={notFound ? 'NFT não encontrado' : 'Não foi possível carregar este NFT'}
          description={notFound ? 'Ele pode ter sido removido ou o endereço está incorreto.' : nft.error.message}
          action={
            notFound ? (
              <Link to="/" className={buttonVariants()}>
                Voltar ao catálogo
              </Link>
            ) : (
              <Button onClick={() => void nft.refetch()}>Tentar novamente</Button>
            )
          }
        />
      </div>
    )
  }

  return <NftDetail key={nft.data.id} nft={nft.data} />
}

function NftDetail({ nft }: { nft: Nft }) {
  const firstAvailable = nft.editions.find((edition) => edition.available > 0)?.type
  const [editionType, setEditionType] = useState<EditionType | undefined>(firstAvailable)
  const [quantity, setQuantity] = useState(1)
  const addToCart = useAddToCart()
  const navigate = useNavigate()

  const edition = nft.editions.find((item) => item.type === editionType)
  const maxQuantity = edition?.available ?? 0
  const soldOut = maxQuantity === 0

    function changeEdition(next: EditionType) {
    setEditionType(next)
    setQuantity(1)
    addToCart.reset()
  }

  function buy() {
    if (!editionType) return
    addToCart.mutate(
      { nftId: nft.id, edition: editionType, quantity },
      { onSuccess: () => void navigate({ to: '/carrinho' }) },
    )
  }

  return (
    <>
      <nav aria-label="Trilha" className="pt-8 pb-5 text-sm font-semibold">
        <ol className="flex gap-1">
          <li>
            <Link to="/" className="hover:text-primary">
              Início
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link to="/" hash="catalogo" className="hover:text-primary">
              Mercado
            </Link>
          </li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[572px_1fr] lg:gap-9">
        <NftGallery images={nft.images} name={nft.name} />

        <div>
          <h1 className="text-2xl font-bold sm:text-[28px]">{nft.name}</h1>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <p className="text-xl font-bold text-primary">
              {nft.priceEth} ETH
              {nft.compareAtPriceEth && (
                <span className="ml-2 text-base font-normal text-muted-foreground line-through">
                  <span className="sr-only">Preço anterior: </span>
                  {nft.compareAtPriceEth} ETH
                </span>
              )}
            </p>
            <p className="flex items-center gap-2 text-sm">
              <span className="flex" aria-hidden>
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={i < Math.round(nft.rating) ? 'size-4 fill-primary text-primary' : 'size-4 fill-muted-foreground text-muted-foreground'}
                  />
                ))}
              </span>
              <span className="sr-only">Nota {nft.rating.toFixed(1)} de 5. </span>
              {nft.reviewCount} avaliações de colecionadores
            </p>
          </div>

          <h2 className="mt-5 text-sm font-bold">Sobre este NFT:</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{nft.description}</p>

          <div className="mt-4">
            <EditionPicker editions={nft.editions} value={editionType} onChange={changeEdition} />
          </div>

          {soldOut ? (
            <p role="status" className="mt-6 rounded-md border border-border bg-card px-4 py-3 text-sm">
              Todas as edições deste NFT estão esgotadas.
            </p>
          ) : (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <QuantityStepper value={quantity} max={maxQuantity} onChange={setQuantity} />
              <div className="flex items-start gap-2">
                <Button className="h-10 px-8 font-bold" onClick={buy} disabled={addToCart.isPending}>
                  {addToCart.isPending ? 'ADICIONANDO…' : 'COMPRAR'}
                </Button>
                <FavoriteButton nftId={nft.id} />
              </div>
            </div>
          )}
          {!soldOut && (
            <p className="mt-2 text-xs text-muted-foreground">
              {maxQuantity === 1 ? 'Última unidade desta edição.' : `${maxQuantity} unidades disponíveis nesta edição.`}
            </p>
          )}

           {addToCart.isError && (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {addToCart.error.message}
            </p>
          )}

          <dl className="mt-6 space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-1">
              <dt>ID do token:</dt>
              <dd>{nft.tokenId}</dd>
            </div>
            <div className="flex gap-1">
              <dt>Coleção:</dt>
              <dd>{nft.collection}</dd>
            </div>
            <div className="flex gap-1">
              <dt>Rede:</dt>
              <dd>{NETWORK_LABELS[nft.network]}</dd>
            </div>
            <div className="flex gap-1">
              <dt>Atributos:</dt>
              <dd>{nft.attributes.join(', ')}</dd>
            </div>
          </dl>
        </div>
      </div>

      <section aria-labelledby="detalhes-titulo" className="mt-16">
        <h2 id="detalhes-titulo" className="inline-block border-b-2 border-primary pb-1 text-lg font-bold text-primary">
          Detalhes do NFT
        </h2>
        <div className="mt-4 space-y-4 border-t border-border pt-4 text-sm leading-6 text-muted-foreground">
          <p>
            {nft.name} é uma obra digital da coleção {nft.collection}. Cada atributo fica armazenado nos metadados do
            token e verificado na {NETWORK_LABELS[nft.network]}.
          </p>
          <p>
            <strong className="block text-foreground">Contrato:</strong>
            Direitos autorais do criador: 5% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.
          </p>
        </div>
      </section>

      <MoreFromCollection currentId={nft.id} />
    </>
  )
}

function MoreFromCollection({ currentId }: { currentId: string }) {
  const list = useQuery(nftListQuery({}))
  const items = list.data?.items.filter((item) => item.id !== currentId).slice(0, 5)

  if (!items || items.length === 0) return null

  return (
    <section aria-labelledby="mais-titulo" className="mt-16">
      <h2 id="mais-titulo" className="border-b border-border pb-3 text-lg font-bold text-primary">
        Mais desta coleção
      </h2>
      <ul className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((item) => (
          <li key={item.id}>
            <NftCard nft={item} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function NftDetailSkeleton() {
  return (
    <div role="status" aria-label="Carregando NFT" className="pt-16">
      <div className="grid gap-8 lg:grid-cols-[572px_1fr] lg:gap-9">
        <div className="flex gap-7">
          <div className="hidden flex-col gap-4 sm:flex">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="size-25" />
            ))}
          </div>
          <Skeleton className="aspect-404/500 flex-1" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  )
}