import { StatePanel } from '@/components/feedback/StatePanel'

/** Provisório: o pagamento completo vem na próxima parte. */
export function CheckoutPage() {
  return (
    <div className="py-16">
      <StatePanel title="Pagamento" description="Esta etapa será construída na próxima parte." />
    </div>
  )
}