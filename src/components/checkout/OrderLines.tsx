import type { QuoteLine } from '@/types/cart'

/** Lista de NFTs usada no pagamento, na revisão e no recibo. */
export function OrderLines({ lines }: { lines: QuoteLine[] }) {
  return (
    <ul className="space-y-3">
      {lines.map((line) => (
        <li key={`${line.nftId}-${line.edition}`} className="flex items-center gap-3 bg-card p-1 pr-3">
          <img src={line.imageUrl} alt="" width={64} height={64} className="size-16 rounded-md object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{line.nftName}</p>
            <p className="text-xs text-muted-foreground">
              ID do token: {line.tokenId} · {line.edition}
            </p>
          </div>
          <span className="text-sm text-muted-foreground">(x {line.quantity})</span>
          <span className="font-bold text-primary">{line.lineTotalEth} ETH</span>
        </li>
      ))}
    </ul>
  )
}