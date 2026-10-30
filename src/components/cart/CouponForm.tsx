import { useState, type SubmitEvent } from 'react'
import { X } from 'lucide-react'
import { useApplyCoupon, useRemoveCoupon } from '@/cart/useCart'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function CouponForm({ appliedCode }: { appliedCode?: string }) {
  const apply = useApplyCoupon()
  const remove = useRemoveCoupon()
  const [code, setCode] = useState('')

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!code.trim()) return
    apply.mutate(code.trim(), { onSuccess: () => setCode('') })
  }

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between rounded-md border border-primary/50 px-3 py-2 text-sm">
        <span>
          Cupom <strong className="text-primary">{appliedCode}</strong> aplicado
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => remove.mutate(undefined)}
          disabled={remove.isPending}
          aria-label={`Remover cupom ${appliedCode}`}
        >
          <X aria-hidden />
          Remover
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Label htmlFor="cupom" className="text-sm font-bold">
        Código promocional
      </Label>
      <div className="mt-2 flex">
        <Input
          id="cupom"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Digite o código promocional..."
          aria-invalid={apply.isError || undefined}
          aria-describedby={apply.isError ? 'cupom-erro' : undefined}
          className="h-10 rounded-r-none border-primary bg-transparent"
        />
        <Button type="submit" className="h-10 rounded-l-none px-5 font-bold" disabled={apply.isPending}>
          {apply.isPending ? 'Aplicando…' : 'Aplicar'}
        </Button>
      </div>
      {apply.isError && (
        <p id="cupom-erro" role="alert" className="mt-2 text-xs text-destructive">
          {apply.error.message}
        </p>
      )}
    </form>
  )
}