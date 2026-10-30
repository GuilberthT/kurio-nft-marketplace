import { useEffect } from 'react'
import { getRouteApi, Link } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, MailCheck, XCircle } from 'lucide-react'
import { ApiError } from '@/api/httpClient'
import { useAuthDialog } from '@/auth/AuthDialogContext'
import { privateKey, useSession } from '@/auth/session'
import { clearDraft } from '@/checkout/draft'
import { clearIdempotencyKey } from '@/checkout/idempotency'
import { useOrder } from '@/checkout/useCheckout'
import { OrderLines } from '@/components/checkout/OrderLines'
import { Skeleton } from '@/components/feedback/Skeleton'
import { StatePanel } from '@/components/feedback/StatePanel'
import { Button, buttonVariants } from '@/components/ui/button'
import { NETWORK_LABELS } from '@/lib/labels'
import type { Order } from '@/types/order'

const route = getRouteApi('/pedido/$orderId')

export function OrderPage() {
  const { orderId } = route.useParams()
  const { user, isLoading } = useSession()
  const { openAuth } = useAuthDialog()
  const order = useOrder(orderId)
  const queryClient = useQueryClient()
  const status = order.data?.status

  useEffect(() => {
    if (status === 'confirmed' || status === 'declined') {
      // Pedido terminou: a próxima compra usa uma chave nova e o carrinho é recarregado.
      clearIdempotencyKey()
      if (status === 'confirmed') clearDraft()
      if (user) void queryClient.invalidateQueries({ queryKey: [...privateKey(user.id), 'cart'] })
    }
  }, [status, user, queryClient])

  if (isLoading) return <Skeleton className="mx-auto mt-16 h-96 max-w-145" />
  if (!user) {
    return (
      <div className="py-16">
        <StatePanel
          title="Entre para ver seu pedido"
          action={<Button onClick={() => openAuth('login')}>Entrar</Button>}
        />
      </div>
    )
  }
  if (order.isPending) return <Skeleton className="mx-auto mt-16 h-96 max-w-145" />
  if (order.isError) {
    const notFound = order.error instanceof ApiError && order.error.code === 'NOT_FOUND'
    return (
      <div className="py-16">
        <StatePanel
          role="alert"
          title={notFound ? 'Pedido não encontrado' : 'Não foi possível carregar o pedido'}
          description={notFound ? undefined : order.error.message}
          action={
            notFound ? (
              <Link to="/" className={buttonVariants()}>
                Voltar ao início
              </Link>
            ) : (
              <Button onClick={() => void order.refetch()}>Tentar novamente</Button>
            )
          }
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-145 py-12">
      <div aria-live="polite">
        {order.data.status === 'pending' && <PendingOrder />}
        {order.data.status === 'declined' && <DeclinedOrder order={order.data} />}
        {order.data.status === 'confirmed' && <Receipt order={order.data} />}
      </div>
    </div>
  )
}

function PendingOrder() {
  return (
    <div role="status" className="flex flex-col items-center gap-4 rounded-lg bg-card px-6 py-16 text-center">
      <Loader2 aria-hidden className="size-10 animate-spin text-primary motion-reduce:animate-none" />
      <h1 className="text-lg font-bold">Aguardando confirmação da rede</h1>
      <p className="text-sm text-muted-foreground">
        Seu pedido foi enviado. Você pode recarregar a página: o status continua sendo acompanhado.
      </p>
    </div>
  )
}

function DeclinedOrder({ order }: { order: Order }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg bg-card px-6 py-16 text-center">
      <XCircle aria-hidden className="size-10 text-destructive" />
      <h1 className="text-lg font-bold">Pagamento recusado</h1>
      <p className="text-sm text-muted-foreground">{order.declineReason}</p>
      <p className="text-sm text-muted-foreground">Seus itens continuam no carrinho.</p>
      <Link to="/carrinho" className={buttonVariants()}>
        Voltar ao carrinho
      </Link>
    </div>
  )
}

function Receipt({ order }: { order: Order }) {
  const date = new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  const shortHash = order.txHash ? `${order.txHash.slice(0, 6)}…${order.txHash.slice(-4)}` : '-'

  return (
    <article className="overflow-hidden rounded-lg border-b-8 border-primary bg-card">
      <header className="flex flex-col items-center gap-3 px-6 pt-8 pb-5 text-center">
        <MailCheck aria-hidden className="size-14 text-primary" />
        <h1 className="font-bold text-primary">Seus NFTs agora estão na sua carteira</h1>
      </header>

      <dl className="grid grid-cols-2 gap-4 border-y border-primary px-6 py-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="font-bold">ID da transação</dt>
          <dd className="text-muted-foreground" title={order.txHash}>
            {shortHash}
          </dd>
        </div>
        <div>
          <dt className="font-bold">Data</dt>
          <dd className="text-muted-foreground">{date}</dd>
        </div>
        <div>
          <dt className="font-bold">Total</dt>
          <dd className="text-muted-foreground">{order.totalEth} ETH</dd>
        </div>
        <div>
          <dt className="font-bold">Carteira</dt>
          <dd className="text-muted-foreground">{order.walletProvider}</dd>
        </div>
      </dl>

      <section aria-labelledby="detalhes-transacao" className="space-y-4 px-6 py-5">
        <h2 id="detalhes-transacao" className="text-sm font-bold">
          Detalhes da transação
        </h2>
        <OrderLines lines={order.lines} />
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{order.subtotalEth} ETH</dd>
          </div>
          {order.discountEth !== '0.00' && (
            <div className="flex justify-between">
              <dt>Desconto</dt>
              <dd>(-) {order.discountEth} ETH</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>Taxa de rede</dt>
            <dd>{order.networkFeeEth} ETH</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2 font-bold">
            <dt>Total</dt>
            <dd className="text-primary">{order.totalEth} ETH</dd>
          </div>
        </dl>
        <p className="text-center text-sm text-muted-foreground">
          Transação confirmada na {NETWORK_LABELS[order.network]}. A propriedade foi transferida para sua carteira
          conectada. (Referência simulada para demonstração.)
        </p>
        <div className="flex justify-center gap-2">
          <Link to="/" className={buttonVariants({ variant: 'outline' })}>
            Continuar explorando
          </Link>
        </div>
      </section>
    </article>
  )
}