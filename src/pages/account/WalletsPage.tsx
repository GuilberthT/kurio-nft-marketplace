import { useState, type SubmitEvent } from 'react'
import { flushSync } from 'react-dom'
import { ApiError } from '@/api/httpClient'
import { useCreateWallet, useUpdateWallet } from '@/account/useAccount'
import { useWallets } from '@/checkout/useCheckout'
import { FormStatus } from '@/components/account/FormStatus'
import { SelectField } from '@/components/account/SelectField'
import { FormField } from '@/components/auth/FormField'
import { compactErrors, focusFirstInvalid, type FieldErrors } from '@/components/auth/validation'
import { Skeleton } from '@/components/feedback/Skeleton'
import { StatePanel } from '@/components/feedback/StatePanel'
import { Button } from '@/components/ui/button'
import { NETWORK_LABELS } from '@/lib/labels'
import { validateWalletAddress } from '@/lib/walletAddress'
import { NETWORKS, type Network } from '@/types/nft'
import { WALLET_KINDS, WALLET_PROVIDERS, type Wallet, type WalletKind, type WalletProvider } from '@/types/wallet'

const KIND_LABELS: Record<WalletKind, string> = { principal: 'Carteira principal', secundaria: 'Carteira secundária' }

export function WalletsPage() {
  const wallets = useWallets()
  const [adding, setAdding] = useState<WalletKind | null>(null)

  if (wallets.isPending) return <Skeleton className="h-96 w-full" />
  if (wallets.isError) {
    return (
      <StatePanel
        role="alert"
        title="Não foi possível carregar as carteiras"
        description={wallets.error.message}
        action={<Button onClick={() => void wallets.refetch()}>Tentar novamente</Button>}
      />
    )
  }

  return (
    <div className="space-y-12">
      <p className="text-sm text-muted-foreground">
        Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.
      </p>
      {WALLET_KINDS.map((kind) => {
        const wallet = wallets.data.find((item) => item.kind === kind)
        const headingId = `carteira-${kind}`
        return (
          <section key={kind} aria-labelledby={headingId}>
            <div className="flex items-center justify-between gap-4">
              <h2 id={headingId} className="text-lg font-bold">
                {KIND_LABELS[kind]}
              </h2>
              {!wallet && adding !== kind && (
                <Button variant="ghost" className="font-bold text-primary" onClick={() => setAdding(kind)}>
                  Adicionar
                </Button>
              )}
            </div>
            {wallet ? (
              <WalletForm key={wallet.id} kind={kind} wallet={wallet} />
            ) : adding === kind ? (
              <WalletForm kind={kind} onCancel={() => setAdding(null)} onCreated={() => setAdding(null)} />
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Nenhuma carteira cadastrada.</p>
            )}
          </section>
        )
      })}
    </div>
  )
}

type Field = 'provider' | 'network' | 'address'

interface WalletFormProps {
  kind: WalletKind
  wallet?: Wallet
  onCancel?: () => void
  onCreated?: () => void
}

function WalletForm({ kind, wallet, onCancel, onCreated }: WalletFormProps) {
  const create = useCreateWallet()
  const update = useUpdateWallet()
  const mutation = wallet ? update : create
  const [values, setValues] = useState<Record<Field, string>>({
    provider: wallet?.provider ?? '',
    network: wallet?.network ?? '',
    address: wallet?.address ?? '',
  })
  const [errors, setErrors] = useState<FieldErrors<Field>>({})

  function change(field: Field, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }))
    mutation.reset()
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const networkValid = (NETWORKS as readonly string[]).includes(values.network)
    const nextErrors = compactErrors<Field>({
      provider: (WALLET_PROVIDERS as readonly string[]).includes(values.provider) ? undefined : 'Selecione o tipo de carteira.',
      network: networkValid ? undefined : 'Selecione uma rede.',
      address: networkValid ? validateWalletAddress(values.network as Network, values.address) : undefined,
    })
    flushSync(() => setErrors(nextErrors))
    if (Object.keys(nextErrors).length > 0) {
      focusFirstInvalid(form)
      return
    }
    const input = {
      provider: values.provider as WalletProvider,
      network: values.network as Network,
      address: values.address.trim(),
    }
    const onError = (error: Error) => {
      if (error instanceof ApiError && error.fieldErrors) {
        flushSync(() => setErrors(error.fieldErrors as FieldErrors<Field>))
        focusFirstInvalid(form)
      }
    }
    if (wallet) update.mutate({ id: wallet.id, ...input }, { onError })
    else create.mutate({ kind, ...input }, { onError, onSuccess: onCreated })
  }

  const generalError =
    mutation.error && !(mutation.error instanceof ApiError && mutation.error.fieldErrors) ? mutation.error.message : null

  return (
    <form noValidate onSubmit={handleSubmit} aria-label={KIND_LABELS[kind]} className="mt-5 grid gap-5 sm:grid-cols-2">
      <SelectField
        label="Tipo de carteira"
        required
        placeholder="Selecione uma carteira"
        options={WALLET_PROVIDERS.map((provider) => ({ value: provider, label: provider }))}
        value={values.provider}
        onChange={(e) => change('provider', e.target.value)}
        error={errors.provider}
      />
      <SelectField
        label="Rede"
        required
        placeholder="Selecione uma rede"
        options={NETWORKS.map((network) => ({ value: network, label: NETWORK_LABELS[network] }))}
        value={values.network}
        onChange={(e) => change('network', e.target.value)}
        error={errors.network}
      />
      <div className="sm:col-span-2">
        <FormField
          label="Endereço da carteira"
          required
          placeholder={values.network === 'solana' ? 'Endereço Solana (base58)' : 'Endereço 0x da carteira'}
          spellCheck={false}
          value={values.address}
          onChange={(e) => change('address', e.target.value)}
          error={errors.address}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <Button type="submit" className="px-8 font-bold" disabled={mutation.isPending}>
          {mutation.isPending ? 'Salvando…' : wallet ? 'Salvar carteira' : 'Cadastrar carteira'}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={mutation.isPending}>
            Cancelar
          </Button>
        )}
        <FormStatus success={update.isSuccess ? 'Carteira atualizada.' : undefined} error={generalError} />
      </div>
    </form>
  )
}