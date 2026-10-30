import { cn } from '@/lib/utils'
import type { EditionType, NftEdition } from '@/types/nft'

interface EditionPickerProps {
  editions: NftEdition[]
  value: EditionType | undefined
  onChange: (edition: EditionType) => void
}

export function EditionPicker({ editions, value, onChange }: EditionPickerProps) {
  return (
    <fieldset>
      <legend className="text-sm font-bold">Edição:</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {editions.map((edition) => {
          const soldOut = edition.available === 0
          const checked = edition.type === value
          return (
            <label
              key={edition.type}
              className={cn(
                'rounded-full border px-2 py-0.5 text-sm uppercase has-focus-visible:ring-2 has-focus-visible:ring-ring',
                checked ? 'border-primary font-bold text-primary' : 'border-border',
                soldOut ? 'cursor-not-allowed line-through opacity-50' : 'cursor-pointer hover:border-primary',
              )}
            >
              <input
                type="radio"
                name="edicao"
                value={edition.type}
                checked={checked}
                disabled={soldOut}
                onChange={() => onChange(edition.type)}
                className="sr-only"
              />
              {edition.type}
              {soldOut && <span className="sr-only"> (esgotada)</span>}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}