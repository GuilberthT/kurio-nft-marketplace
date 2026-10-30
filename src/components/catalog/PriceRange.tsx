import { useState } from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { Button } from '@/components/ui/button'
import { formatEth, parseEth } from '@/lib/eth'

const WEI_PER_CENT = 10n ** 16n

function ethToCents(value: string): number {
  return Number(parseEth(value) / WEI_PER_CENT)
}

function centsToEth(cents: number): string {
  return formatEth(BigInt(cents) * WEI_PER_CENT, 2)
}

interface PriceRangeProps {
  boundsEth: { minEth: string; maxEth: string }
  valueEth: { min?: string; max?: string }
  onApply: (range: { min?: string; max?: string }) => void
}

export function PriceRange({ boundsEth, valueEth, onApply }: PriceRangeProps) {
  const lower = ethToCents(boundsEth.minEth)
  const upper = ethToCents(boundsEth.maxEth)
  const [range, setRange] = useState<[number, number]>([
    valueEth.min ? ethToCents(valueEth.min) : lower,
    valueEth.max ? ethToCents(valueEth.max) : upper,
  ])

  function apply() {
    onApply({
      min: range[0] > lower ? centsToEth(range[0]) : undefined,
      max: range[1] < upper ? centsToEth(range[1]) : undefined,
    })
  }

  return (
    <div>
      <SliderPrimitive.Root
        min={lower}
        max={upper}
        step={1}
        minStepsBetweenThumbs={1}
        value={range}
        onValueChange={(next) => setRange([next[0], next[1]])}
        className="relative flex h-5 touch-none items-center select-none"
      >
        <SliderPrimitive.Track className="relative h-1 grow rounded-full bg-border">
          <SliderPrimitive.Range className="absolute h-full rounded-full bg-primary" />
        </SliderPrimitive.Track>
        {(['Preço mínimo', 'Preço máximo'] as const).map((label) => (
          <SliderPrimitive.Thumb
            key={label}
            aria-label={label}
            className="block size-4 rounded-full border-2 border-primary bg-[#7e5430] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          />
        ))}
      </SliderPrimitive.Root>
      <p className="mt-3 text-sm" aria-live="polite">
        Preço: {centsToEth(range[0]).replace('.', ',')} - {centsToEth(range[1]).replace('.', ',')} ETH
      </p>
      <Button size="sm" className="mt-3 font-bold" onClick={apply}>
        Aplicar
      </Button>
    </div>
  )
}