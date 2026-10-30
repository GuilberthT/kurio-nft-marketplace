import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/feedback/Skeleton'
import { CATEGORY_LABELS, NETWORK_LABELS } from '@/lib/labels'
import { cn } from '@/lib/utils'
import { nftFacetsQuery } from '@/queries/nfts'
import { CATEGORIES, NETWORKS, type Category, type Network } from '@/types/nft'
import type { CatalogSearch } from '@/lib/catalogSearch'
import { PriceRange } from './PriceRange'

interface CatalogFiltersProps {
  search: CatalogSearch
  onChange: (patch: Partial<CatalogSearch>) => void
}

function toggle<T>(list: T[] | undefined, item: T): T[] | undefined {
  const current = list ?? []
  const next = current.includes(item) ? current.filter((value) => value !== item) : [...current, item]
  return next.length > 0 ? next : undefined
}

export function CatalogFilters({ search, onChange }: CatalogFiltersProps) {
  const facets = useQuery(nftFacetsQuery())

  return (
    <div className="space-y-8 rounded-sm bg-card px-5 py-6">
      <fieldset>
        <legend className="text-lg font-bold">Coleções</legend>
        <ul className="mt-4 space-y-1">
          {CATEGORIES.map((category) => (
            <FilterOption<Category>
              key={category}
              value={category}
              label={CATEGORY_LABELS[category]}
              count={facets.data?.categories[category]}
              checked={search.categories?.includes(category) ?? false}
              onToggle={() => onChange({ categories: toggle(search.categories, category) })}
            />
          ))}
        </ul>
      </fieldset>

      <fieldset>
        <legend className="text-lg font-bold">Faixa de preço</legend>
        <div className="mt-4 px-1">
          {facets.data ? (
            <PriceRange
              key={`${search.minPrice ?? ''}-${search.maxPrice ?? ''}`}
              boundsEth={facets.data.priceRange}
              valueEth={{ min: search.minPrice, max: search.maxPrice }}
              onApply={({ min, max }) => onChange({ minPrice: min, maxPrice: max })}
            />
          ) : (
            <Skeleton className="h-20 w-full" />
          )}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-lg font-bold">Rede</legend>
        <ul className="mt-4 space-y-1">
          {NETWORKS.map((network) => (
            <FilterOption<Network>
              key={network}
              value={network}
              label={NETWORK_LABELS[network]}
              count={facets.data?.networks[network]}
              checked={search.networks?.includes(network) ?? false}
              onToggle={() => onChange({ networks: toggle(search.networks, network) })}
            />
          ))}
        </ul>
      </fieldset>
    </div>
  )
}

interface FilterOptionProps<T extends string> {
  value: T
  label: string
  count?: number
  checked: boolean
  onToggle: () => void
}

function FilterOption<T extends string>({ value, label, count, checked, onToggle }: FilterOptionProps<T>) {
  const id = `filtro-${value}`
  return (
    <li>
      <label
        htmlFor={id}
        className={cn(
          'flex cursor-pointer items-center justify-between rounded px-3 py-2 text-sm hover:bg-secondary has-focus-visible:ring-2 has-focus-visible:ring-ring',
          checked && 'text-primary',
        )}
      >
        <span className="flex items-center gap-2">
          <input id={id} type="checkbox" checked={checked} onChange={onToggle} className="sr-only" />
          <span
            aria-hidden="true"
            className={cn('size-2 rounded-full border border-current', checked ? 'bg-current' : 'bg-transparent')}
          />
          {label}
        </span>
        <span className="font-semibold tabular-nums">{count === undefined ? '' : `(${count})`}</span>
      </label>
    </li>
  )
}