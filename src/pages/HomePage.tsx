import { useQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { SlidersHorizontal } from 'lucide-react'
import { CatalogFilters } from '@/components/catalog/CatalogFilters'
import { Hero } from '@/components/catalog/Hero'
import { NftCard, NftCardSkeleton } from '@/components/catalog/NftCard'
import { Pagination } from '@/components/catalog/Pagination'
import { StatePanel } from '@/components/feedback/StatePanel'
import { Button, buttonVariants } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import type { CatalogSearch } from '@/lib/catalogSearch'
import { SORT_LABELS, TAB_LABELS } from '@/lib/labels'
import { cn } from '@/lib/utils'
import { nftListQuery } from '@/queries/nfts'
import { NFT_SORTS, NFT_TABS, type NftSort } from '@/types/nft'

const route = getRouteApi('/')
const PAGE_SIZE = 9

export function HomePage() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const list = useQuery(nftListQuery(search))

  function changeFilters(patch: Partial<CatalogSearch>) {
    void navigate({ search: (prev) => ({ ...prev, ...patch, page: undefined }), resetScroll: false })
  }

  const activeTab = search.tab ?? 'todos'
  const hasFilters = Boolean(
    search.q || search.categories || search.networks || search.minPrice || search.maxPrice || search.tab,
  )

  return (
    <>
      <Hero />

      <section id="catalogo" aria-labelledby="catalogo-titulo" className="scroll-mt-20 pt-12">
        <h2 id="catalogo-titulo" className="sr-only">
          Catálogo de NFTs
        </h2>

        <div className="grid gap-12 lg:grid-cols-[310px_1fr]">
          <aside aria-label="Filtros" className="hidden lg:block">
            <CatalogFilters search={search} onChange={changeFilters} />
          </aside>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <nav aria-label="Seções do catálogo" className="flex gap-5 overflow-x-auto text-sm">
                {NFT_TABS.map((tab) => (
                  <Link
                    key={tab}
                    to="/"
                    search={(prev) => ({ ...prev, tab: tab === 'todos' ? undefined : tab, page: undefined })}
                    resetScroll={false}
                    activeOptions={{ explicitUndefined: true }}
                    className={cn(
                      'shrink-0 border-b-2 pb-1 font-semibold',
                      tab === activeTab ? 'border-primary text-primary' : 'border-transparent hover:text-primary',
                    )}
                  >
                    {TAB_LABELS[tab]}
                  </Link>
                ))}
              </nav>

              <div className="flex flex-wrap items-center gap-3">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden">
                      <SlidersHorizontal aria-hidden />
                      Filtros
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Filtros</SheetTitle>
                    </SheetHeader>
                    <CatalogFilters search={search} onChange={changeFilters} />
                  </SheetContent>
                </Sheet>

                <label className="flex min-w-0 items-center gap-1 text-sm">
                  Ordenar por:
                  <select
                    value={search.sort ?? 'recentes'}
                    onChange={(event) => {
                      const sort = event.target.value as NftSort
                      changeFilters({ sort: sort === 'recentes' ? undefined : sort })
                    }}
                    className="min-w-0 max-w-full rounded-sm bg-transparent py-1 pr-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    
                  >
                    {NFT_SORTS.map((sort) => (
                      <option key={sort} value={sort} className="bg-card">
                        {SORT_LABELS[sort]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {search.q && (
              <p className="mt-4 text-sm text-muted-foreground">
                Resultados para <strong className="text-foreground">“{search.q}”</strong>
              </p>
            )}

            <p className="sr-only" aria-live="polite">
              {list.isFetching ? 'Carregando NFTs…' : list.data ? `${list.data.total} NFTs encontrados` : ''}
            </p>

            <div className="mt-8">
              {list.isPending ? (
                <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-8">
                  {Array.from({ length: PAGE_SIZE }, (_, i) => (
                    <li key={i}>
                      <NftCardSkeleton />
                    </li>
                  ))}
                </ul>
              ) : list.isError ? (
                <StatePanel
                  role="alert"
                  title="Não foi possível carregar os NFTs"
                  description={list.error.message}
                  action={<Button onClick={() => void list.refetch()}>Tentar novamente</Button>}
                />
              ) : list.data.items.length === 0 ? (
                <StatePanel
                  title="Nenhum NFT encontrado"
                  description="Tente outros termos ou remova alguns filtros."
                  action={
                    hasFilters && (
                      <Link to="/" search={{}} resetScroll={false} className={buttonVariants({ variant: 'outline' })}>
                        Limpar filtros
                      </Link>
                    )
                  }
                />
              ) : (
                <>
                  <ul
                    aria-busy={list.isFetching}
                    className={cn(
                      'grid grid-cols-2 gap-x-4 gap-y-10 transition-opacity sm:grid-cols-3 sm:gap-x-8',
                      list.isPlaceholderData && 'opacity-60',
                    )}
                  >
                    {list.data.items.map((nft, index) => (
                      <li key={nft.id}>
                        <NftCard nft={nft} priority={index < 3} />
                      </li>
                    ))}
                  </ul>
                  <Pagination page={list.data.page} totalPages={list.data.totalPages} />
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}