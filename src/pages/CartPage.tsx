import { Link, useNavigate } from '@tanstack/react-router'
import { useAuthDialog } from '@/auth/AuthDialogContext'
import { useSession } from '@/auth/session'
import { useCart, useRemoveCartItem, useUpdateCartItem } from '@/cart/useCart'
import { CartLineRow } from '@/components/cart/CartLineRow'
import { CartSummary, CartSummarySkeleton } from '@/components/cart/CartSummary'
import { CouponForm } from '@/components/cart/CouponForm'
import { Skeleton } from '@/components/feedback/Skeleton'
import { StatePanel } from '@/components/feedback/StatePanel'
import { Button, buttonVariants } from '@/components/ui/button'

export function CartPage() {
  const cart = useCart()
  const update = useUpdateCartItem()
  const remove = useRemoveCartItem()
  const { user } = useSession()
  const { openAuth } = useAuthDialog()
  const navigate = useNavigate()

  const quote = cart.data
  const hasProblem = quote?.lines.some((line) => line.quantity > line.available) ?? false
  const mutationError = update.error ?? remove.error

  function goToCheckout() {
    if (!user) {
      openAuth('login', 'Entre para finalizar a compra. Seus itens continuam no carrinho.')
      return
    }
    void navigate({ to: '/pagamento' })
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
          <li aria-hidden>/</li>
          <li aria-current="page">Carrinho</li>
        </ol>
      </nav>
      <h1 className="sr-only">Carrinho de NFTs</h1>

      {cart.isError ? (
        <StatePanel
          role="alert"
          title="Não foi possível carregar o carrinho"
          description={cart.error.message}
          action={<Button onClick={() => void cart.refetch()}>Tentar novamente</Button>}
        />
      ) : quote && quote.lines.length === 0 ? (
        <StatePanel
          title="Seu carrinho está vazio"
          description="Explore o catálogo e adicione NFTs para começar sua coleção."
          action={
            <Link to="/" hash="catalogo" className={buttonVariants()}>
              Explorar NFTs
            </Link>
          }
        />
      ) : (
        <div className="grid gap-10 lg:grid-cols-[1fr_332px] lg:gap-20">
          <section aria-label="Itens do carrinho">
            <div
              aria-hidden
              className="hidden grid-cols-[70px_1fr_110px_130px_110px_40px] gap-x-4 border-b border-border pb-3 font-bold sm:grid"
            >
              <span className="col-span-2">NFTs</span>
              <span>Preço</span>
              <span>Edições</span>
              <span>Total</span>
            </div>
            {mutationError && (
              <p role="alert" className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {mutationError.message}
              </p>
            )}
            <ul className="mt-3 space-y-3" aria-busy={cart.isFetching}>
              {quote
                ? quote.lines.map((line) => (
                    <CartLineRow
                      key={`${line.nftId}-${line.edition}`}
                      line={line}
                      busy={update.isPending || remove.isPending}
                      onQuantityChange={(quantity) =>
                        update.mutate({ nftId: line.nftId, edition: line.edition, quantity })
                      }
                      onRemove={() => remove.mutate({ nftId: line.nftId, edition: line.edition })}
                    />
                  ))
                : Array.from({ length: 3 }, (_, i) => (
                    <li key={i}>
                      <Skeleton className="h-17.5 w-full" />
                    </li>
                  ))}
            </ul>
          </section>

          <aside aria-labelledby="resumo-titulo" className="space-y-5">
            <h2 id="resumo-titulo" className="border-b border-border pb-3 text-lg font-bold">
              Resumo da carteira
            </h2>
            {quote ? (
              <>
                <CouponForm appliedCode={quote.couponCode} />
                <div aria-live="polite">
                  <CartSummary quote={quote} />
                </div>
                <Button className="h-10 w-full font-bold" onClick={goToCheckout} disabled={hasProblem}>
                  Conectar e finalizar
                </Button>
                {hasProblem && (
                  <p className="text-center text-xs text-destructive">Ajuste os itens com problema para continuar.</p>
                )}
              </>
            ) : (
              <CartSummarySkeleton />
            )}
            <Link to="/" hash="catalogo" className="block text-center text-sm text-primary hover:underline">
              Continuar explorando
            </Link>
          </aside>
        </div>
      )}
    </>
  )
}