import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface QuantityStepperProps {
  value: number
  max: number
  onChange: (value: number) => void
  label?: string
}

export function QuantityStepper({ value, max, onChange, label = 'Quantidade' }: QuantityStepperProps) {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-3">
      <Button
        type="button"
        size="icon"
        className="rounded-full"
        aria-label="Diminuir quantidade"
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
      >
        <Minus aria-hidden />
      </Button>
      <output aria-live="polite" className="w-6 text-center text-lg tabular-nums">
        {value}
      </output>
      <Button
        type="button"
        size="icon"
        className="rounded-full"
        aria-label="Aumentar quantidade"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        <Plus aria-hidden />
      </Button>
    </div>
  )
}