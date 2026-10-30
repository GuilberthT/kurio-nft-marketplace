import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  totalPages: number
}

const itemClass =
  'flex size-9 items-center justify-center rounded-sm border border-border text-sm hover:border-primary focus-visible:outline-2 focus-visible:outline-ring'

export function Pagination({ page, totalPages }: PaginationProps) {
  if (totalPages <= 1) return null
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  const toPage = (target: number) => (target > 1 ? target : undefined)

  return (
    <nav aria-label="Paginação" className="mt-12 flex justify-end">
      <ul className="flex items-center gap-2">
        {page > 1 && (
          <li>
            <Link to="/" search={(prev) => ({ ...prev, page: toPage(page - 1) })} hash="catalogo" className={itemClass} aria-label="Página anterior">
              <ChevronLeft aria-hidden className="size-4" />
            </Link>
          </li>
        )}
        {pages.map((target) => (
          <li key={target}>
            <Link
              to="/"
              search={(prev) => ({ ...prev, page: toPage(target) })}
              hash="catalogo"
              activeOptions={{ explicitUndefined: true }}
              aria-label={`Página ${target}`}
              className={cn(itemClass, target === page && 'border-primary bg-primary font-bold text-primary-foreground')}
            >
              {target}
            </Link>
          </li>
        ))}
        {page < totalPages && (
          <li>
            <Link to="/" search={(prev) => ({ ...prev, page: toPage(page + 1) })} hash="catalogo" className={itemClass} aria-label="Próxima página">
              <ChevronRight aria-hidden className="size-4" />
            </Link>
          </li>
        )}
      </ul>
    </nav>
  )
}