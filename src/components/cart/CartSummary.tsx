import type { ReactNode } from 'react'
import { Skeleton } from '@/components/feedback/Skeleton'
import type { Quote } from '@/types/cart'

export function CartSummary({ quote }: { quote: Quote }) {
  const hasDiscount = quote.discountEth !== '0.00'
  return (
    <dl className="space-y-3 text-sm">
      <Row label="Subtotal">{quote.subtotalEth} ETH</Row>
      <Row label="Desconto do lançamento">{hasDiscount ? `(-) ${quote.discountEth} ETH` : '(-) 0.00'}</Row>
      <Row label="Taxa de rede">{quote.networkFeeEth} ETH</Row>
      <p className="text-right text-xs text-primary">Taxa estimada</p>
      <div className="flex items-center justify-between border-t border-border pt-4 text-base font-bold">
        <dt>Total</dt>
        <dd className="text-lg text-primary">{quote.totalEth} ETH</dd>
      </div>
    </dl>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt>{label}</dt>
      <dd className="tabular-nums">{children}</dd>
    </div>
  )
}

export function CartSummarySkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-5 w-full" />
      ))}
      <Skeleton className="mt-4 h-7 w-full" />
    </div>
  )
}