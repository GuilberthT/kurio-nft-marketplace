import { useEffect, useState, type SubmitEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { CheckCircle2, Wallet as WalletIcon } from 'lucide-react'
import { ApiError } from '@/api/httpClient'
import { useAuthDialog } from '@/auth/AuthDialogContext'
import { useSession } from '@/auth/session'
import { useCart } from '@/cart/useCart'
import { loadDraft, saveDraft, type CheckoutDraft } from '@/checkout/draft'
import { useConnectWallet, useCreateOrder, useWallets } from '@/checkout/useCheckout'
import { compactErrors, focusFirstInvalid, validateEmail, type FieldErrors } from '@/components/auth/validation'
import { CartSummary, CartSummarySkeleton } from '@/components/cart/CartSummary'
import { OrderLines } from '@/components/checkout/OrderLines'
import { ReviewDialog } from '@/components/checkout/ReviewDialog'
import { Skeleton } from '@/components/feedback/Skeleton'
import { StatePanel } from '@/components/feedback/StatePanel'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NETWORK_LABELS } from '@/lib/labels'
import { cn } from '@/lib/utils'
import { NETWORKS, type Network } from '@/types/nft'

type Field = 'displayName' | 'email' | 'network' | 'walletId'

export function CheckoutPage() {
  const { user, isLoading } = useSession()
  const { openAuth } = useAuthDialog()

  if (isLoading) return <Skeleton className="mt-16 h-96 w-full" />

  if (!user) {
    return (
      <div className="py-16">
        <StatePanel
          title="Entre para finalizar a compra"
          description="Seus itens e o que você já preencheu continuam salvos."
          action={<Button onClick={() => openAuth('login')}>Entrar</Button>}
        />
      </div>
    )
  }

  return <CheckoutForm />
}

function CheckoutForm() {
  const { user } = useSession()
  const cart = useCart()
  const wallets = useWallets()
  const connect = useConnectWallet()
  const createOrder = useCreateOrder()
  const navigate = useNavigate()

  const [draft, setDraft] = useState<CheckoutDraft>(() => {
    const saved = loadDraft()
    return { ...saved, displayName: saved.displayName || user?.name || '', email: saved.email || user?.email || '' }
  })
  const [errors, setErrors] = useState<FieldErrors<Field>>({})
  const [connectedId, setConnectedId] = useState<string | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewedTotal, setReviewedTotal] = useState<string | null>(null)

  useEffect(() => saveDraft(draft), [draft])

  const quote = cart.data
  const wallet = wallets.data?.find((item) => item.id === draft.walletId)
  const network = draft.network as Network

  function update<K extends keyof CheckoutDraft>(field: K, value: CheckoutDraft[K]) {
    setDraft((prev) => ({ ...prev, [field]: value }))
    if (field === 'walletId') {
      setConnectedId(null)
      connect.reset()
    }
  }

  function handleConnect() {
    if (!wallet) return
    connect.mutate(wallet.id, { onSuccess: () => setConnectedId(wallet.id) })
  }

  function handleReview(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const nextErrors = compactErrors<Field>({
      displayName: draft.displayName.trim() ? undefined : 'Informe o nome de exibição.',
      email: validateEmail(draft.email),
      network: (NETWORKS as readonly string[]).includes(draft.network) ? undefined : 'Selecione uma rede.',
      walletId: !wallet ? 'Selecione uma carteira.' : connectedId !== wallet.id ? 'Conecte a carteira antes de continuar.' : undefined,
    })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      requestAnimationFrame(() => focusFirstInvalid(form))
      return
    }
        createOrder.reset()
    setReviewedTotal(quote ? quoteSignature(quote) : null)
    setReviewOpen(true)
  }

    const quoteChanged = Boolean(quote && reviewedTotal && quoteSignature(quote) !== reviewedTotal)

  function handleConfirm() {
    if (!quote || !wallet || createOrder.isPending) return
    // O usuário confirma os valores que está vendo agora; eles viram a nova referência.
    setReviewedTotal(quoteSignature(quote))
    createOrder.mutate(
      {
        expected: {
          totalEth: quote.totalEth,
          lines: quote.lines.map(({ nftId, edition, quantity, unitPriceEth }) => ({ nftId, edition, quantity, unitPriceEth })),
        },
        walletId: wallet.id,
        network,
        buyer: { displayName: draft.displayName.trim(), email: draft.email.trim(), note: draft.note.trim() || undefined },
      },
      { onSuccess: (order) => void navigate({ to: '/pedido/$orderId', params: { orderId: order.id } }) },
    )
  }

  const orderError =
    createOrder.error instanceof ApiError && createOrder.error.code === 'NETWORK'
      ? 'A conexão caiu antes da resposta. Clique em confirmar de novo: o mesmo pedido será recuperado, sem cobrança duplicada.'
      : createOrder.error?.message

  if (quote && quote.lines.length === 0) {
    return (
      <div className="py-16">
        <StatePanel
          title="Seu carrinho está vazio"
          description="Adicione NFTs antes de ir para o pagamento."
          action={
            <Link to="/" hash="catalogo" className={buttonVariants()}>
              Explorar NFTs
            </Link>
          }
        />
      </div>
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
            <Link to="/carrinho" className="hover:text-primary">
              Carrinho
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page">Pagamento</li>
        </ol>
      </nav>
      <h1 className="sr-only">Pagamento</h1>

      <form noValidate onSubmit={handleReview} className="grid gap-10 lg:grid-cols-[1fr_405px] lg:gap-8">
        <section aria-labelledby="perfil-titulo">
          <h2 id="perfil-titulo" className="text-lg font-bold">
            Perfil do colecionador
          </h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <TextField
              id="displayName"
              label="Nome de exibição"
              required
              value={draft.displayName}
              onChange={(value) => update('displayName', value)}
              error={errors.displayName}
              autoComplete="name"
            />
            <TextField id="username" label="Nome de usuário" value={`@${user?.username ?? ''}`} readOnly />
            <TextField
              id="email"
              label="E-mail"
              type="email"
              required
              value={draft.email}
              onChange={(value) => update('email', value)}
              error={errors.email}
              autoComplete="email"
            />
            <div className="space-y-1.5">
              <Label htmlFor="network">
                Rede <span aria-hidden className="text-primary">*</span>
              </Label>
              <select
                id="network"
                value={draft.network}
                onChange={(event) => update('network', event.target.value)}
                aria-invalid={errors.network ? true : undefined}
                aria-describedby={errors.network ? 'network-erro' : undefined}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive"
              >
                <option value="">Selecione uma rede</option>
                {NETWORKS.map((item) => (
                  <option key={item} value={item}>
                    {NETWORK_LABELS[item]}
                  </option>
                ))}
              </select>
              {errors.network && (
                <p id="network-erro" className="text-xs text-destructive">
                  {errors.network}
                </p>
              )}
            </div>
          </div>
          <div className="mt-5 space-y-1.5">
            <Label htmlFor="note">Observação do colecionador (opcional)</Label>
            <textarea
              id="note"
              rows={4}
              value={draft.note}
              onChange={(event) => update('note', event.target.value)}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-1/2"
            />
          </div>
        </section>

        <aside aria-labelledby="seus-nfts" className="space-y-5">
          <h2 id="seus-nfts" className="text-lg font-bold">
            Seus NFTs
          </h2>
          {quote ? (
            <>
              <OrderLines lines={quote.lines} />
              <CartSummary quote={quote} />
            </>
          ) : (
            <CartSummarySkeleton />
          )}

          <fieldset aria-describedby={errors.walletId ? 'wallet-erro' : undefined}>
            <legend className="text-center text-lg font-bold">Carteira e rede</legend>
            <div className="mt-3 space-y-2">
              {wallets.isPending && <Skeleton className="h-14 w-full" />}
              {wallets.data?.map((item) => (
                <label
                  key={item.id}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm has-focus-visible:ring-2 has-focus-visible:ring-ring',
                    draft.walletId === item.id ? 'border-primary' : 'border-border',
                  )}
                >
                  <input
                    type="radio"
                    name="walletId"
                    value={item.id}
                    checked={draft.walletId === item.id}
                    onChange={() => update('walletId', item.id)}
                    aria-invalid={errors.walletId ? true : undefined}
                    className="accent-primary"
                  />
                  <WalletIcon aria-hidden className="size-4 text-primary" />
                  <span className="flex-1">
                    <span className="font-bold">{item.provider}</span>{' '}
                    <span className="text-muted-foreground">
                      ({item.kind === 'principal' ? 'principal' : 'secundária'}) · {item.address.slice(0, 6)}…{item.address.slice(-4)}
                    </span>
                  </span>
                  {connectedId === item.id && <CheckCircle2 aria-label="Conectada" className="size-4 text-primary" />}
                </label>
              ))}
            </div>

            <div className="mt-3" aria-live="polite">
              {wallet && connectedId === wallet.id ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-primary">{wallet.provider} conectada</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setConnectedId(null)}>
                    Desconectar
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleConnect}
                  disabled={!wallet || connect.isPending}
                >
                  {connect.isPending ? 'Aguardando a carteira…' : 'Conectar carteira'}
                </Button>
              )}
              {connect.isError && (
                <p role="alert" className="mt-2 text-xs text-destructive">
                  {connect.error.message}
                </p>
              )}
              {errors.walletId && (
                <p id="wallet-erro" className="mt-2 text-xs text-destructive">
                  {errors.walletId}
                </p>
              )}
            </div>
          </fieldset>

          <Button type="submit" className="h-10 w-full font-bold" disabled={!quote}>
            Revisar e confirmar compra
          </Button>
        </aside>
      </form>

      {quote && wallet && (
        <ReviewDialog
          open={reviewOpen}
          onOpenChange={setReviewOpen}
          quote={quote}
          wallet={wallet}
          network={network}
          submitting={createOrder.isPending}
          errorMessage={orderError}
           changed={quoteChanged}
          onConfirm={handleConfirm}
        />
      )}
    </>
  )
}

/** Resume o que importa para o usuário: itens, quantidades, preços, estoque e total. */
function quoteSignature(quote: { totalEth: string; lines: { nftId: string; quantity: number; unitPriceEth: string; available: number }[] }) {
  return JSON.stringify([quote.totalEth, quote.lines.map((line) => [line.nftId, line.quantity, line.unitPriceEth, line.available])])
}

interface TextFieldProps {
  id: string
  label: string
  value: string
  onChange?: (value: string) => void
  error?: string
  required?: boolean
  readOnly?: boolean
  type?: string
  autoComplete?: string
}

function TextField({ id, label, value, onChange, error, required, readOnly, type = 'text', autoComplete }: TextFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label} {required && <span aria-hidden className="text-primary">*</span>}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        readOnly={readOnly}
        required={required}
        autoComplete={autoComplete}
        onChange={(event) => onChange?.(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-erro` : undefined}
        className={cn('h-10 bg-transparent', readOnly && 'text-muted-foreground')}
      />
      {error && (
        <p id={`${id}-erro`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}