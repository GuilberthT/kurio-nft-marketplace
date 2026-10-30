import { CartSummary } from '@/components/cart/CartSummary'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { NETWORK_LABELS } from '@/lib/labels'
import type { Quote } from '@/types/cart'
import type { Network } from '@/types/nft'
import type { Wallet } from '@/types/wallet'
import { OrderLines } from './OrderLines'

interface ReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quote: Quote
  wallet: Wallet
  network: Network
  submitting: boolean
  errorMessage?: string
  /** Os valores mudaram desde que a revisão foi aberta (ex.: evento de tempo real). */
  changed: boolean
  onConfirm: () => void
}

export function ReviewDialog({ open, onOpenChange, quote, wallet, network, submitting, errorMessage, changed, onConfirm }: ReviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto border-border bg-card sm:max-w-140">
        <DialogHeader>
          <DialogTitle>Revise seu pedido</DialogTitle>
          <DialogDescription>
            Pagamento com {wallet.provider} na rede {NETWORK_LABELS[network]}. Confira os valores antes de confirmar.
          </DialogDescription>
        </DialogHeader>

        {changed && !errorMessage && (
          <p role="alert" className="rounded-md border border-primary/50 bg-primary/10 px-3 py-2 text-sm">
            Os valores do pedido mudaram enquanto você revisava. Confira o novo total antes de confirmar.
          </p>
        )}
        {errorMessage && (
          <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </p>
        )}

        <OrderLines lines={quote.lines} />
        <div aria-live="polite">
          <CartSummary quote={quote} />
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Voltar
          </Button>
          <Button className="font-bold" onClick={onConfirm} disabled={submitting}>
            {submitting ? 'Enviando pedido…' : `Confirmar compra de ${quote.totalEth} ETH`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}