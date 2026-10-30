import { Link } from '@tanstack/react-router'
import { Skeleton } from '@/components/feedback/Skeleton'
import type { Nft } from '@/types/nft'

export function NftCard({ nft, priority = false }: { nft: Nft; priority?: boolean }) {
  return (
    <article className="group">
      <Link
        to="/nft/$nftId"
        params={{ nftId: nft.id }}
        className="block rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        <div className="bg-card p-1">
          <img
            src={nft.images[0]}
            alt=""
            width={250}
            height={250}
            loading={priority ? 'eager' : 'lazy'}
            className="aspect-square w-full rounded-2xl object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none"
          />
        </div>
        <h3 className="mt-3 text-sm">{nft.name}</h3>
      </Link>
      <p className="mt-1 text-sm font-bold text-primary">
        {nft.priceEth} ETH
        {nft.compareAtPriceEth && (
          <span className="ml-2 font-normal text-muted-foreground line-through">
            <span className="sr-only">Preço anterior: </span>
            {nft.compareAtPriceEth} ETH
          </span>
        )}
      </p>
    </article>
  )
}

export function NftCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-square w-full" />
      <Skeleton className="mt-3 h-4 w-3/4" />
      <Skeleton className="mt-2 h-4 w-1/3" />
    </div>
  )
}