import { Trash2 } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { QuantityStepper } from '@/components/nft/QuantityStepper'
import { Button } from '@/components/ui/button'
import type { QuoteLine } from '@/types/cart'

interface CartLineRowProps {
  line: QuoteLine
  busy: boolean
  onQuantityChange: (quantity: number) => void
  onRemove: () => void
}

export function CartLineRow({ line, busy, onQuantityChange, onRemove }: CartLineRowProps) {
  const overStock = line.quantity > line.available

  return (
    <li className="grid grid-cols-[70px_1fr_auto] items-center gap-x-4 gap-y-3 bg-card p-3 sm:grid-cols-[70px_1fr_110px_130px_110px_40px] sm:p-0 sm:pr-4">
      <img src={line.imageUrl} alt="" width={70} height={70} className="size-17.5 object-cover sm:rounded-none" />

      <div className="min-w-0">
        <Link to="/nft/$nftId" params={{ nftId: line.nftId }} className="block truncate font-bold hover:text-primary">
          {line.nftName}
        </Link>
        <p className="text-sm text-muted-foreground">
          ID do token: {line.tokenId} · Edição {line.edition}
        </p>
        {overStock && (
          <p role="alert" className="mt-1 text-xs text-destructive">
            {line.available === 0
              ? 'Esta edição esgotou. Remova o item para continuar.'
              : `Só restam ${line.available} unidade(s). Ajuste a quantidade.`}
          </p>
        )}
      </div>

      <p className="col-start-2 text-sm font-bold text-primary sm:col-start-auto">
        <span className="sr-only">Preço unitário: </span>
        {line.unitPriceEth} ETH
      </p>

      <div className="col-start-2 sm:col-start-auto">
        <QuantityStepper
          label={`Quantidade de ${line.nftName}`}
          value={line.quantity}
          max={Math.max(line.available, 1)}
          onChange={onQuantityChange}
        />
      </div>

      <p className="col-start-3 row-start-1 text-right font-bold text-primary sm:col-start-auto sm:row-start-auto sm:text-left">
        <span className="sr-only">Total do item: </span>
        {line.lineTotalEth} ETH
      </p>

      <Button
        variant="ghost"
        size="icon"
        className="col-start-3 justify-self-end sm:col-start-auto"
        aria-label={`Remover ${line.nftName} do carrinho`}
        disabled={busy}
        onClick={onRemove}
      >
        <Trash2 aria-hidden />
      </Button>
    </li>
  )
}