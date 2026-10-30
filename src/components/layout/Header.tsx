import { useState, type SubmitEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { LogIn, LogOut, Search, ShoppingCart, X } from 'lucide-react'
import { useAuthDialog } from '@/auth/AuthDialogContext'
import { useLogout, useSession } from '@/auth/session'
import { Button, buttonVariants } from '@/components/ui/button'
import { useCartCount } from '@/cart/useCart'

const NAV_SOON = ['Criadores', 'Aprenda'] as const

export function Header() {
  const navigate = useNavigate()
  const { user, isLoading } = useSession()
  const { openAuth } = useAuthDialog()
  const logout = useLogout()
  const cartCount = useCartCount()
  const [searchOpen, setSearchOpen] = useState(false)
  const [term, setTerm] = useState('')

  function handleSearch(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const q = term.trim()
    void navigate({ to: '/', search: q ? { q } : {}, hash: 'catalogo' })
    setSearchOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-300 items-center gap-6 px-4 lg:px-0">
        <Link to="/" className="text-sm font-bold tracking-[0.2em]">
          KURIO
        </Link>

        <nav aria-label="Principal" className="mx-auto hidden items-center gap-10 md:flex">
          <Link
            to="/"
            activeOptions={{ exact: true, includeSearch: false }}
            className="border-b-2 border-transparent py-5 text-sm hover:text-primary"
            activeProps={{ className: 'border-primary! text-primary font-semibold' }}
          >
            Início
          </Link>
          <Link to="/" hash="catalogo" activeOptions={{ includeHash: true }} className="py-5 text-sm hover:text-primary">
            Mercado
          </Link>
          {NAV_SOON.map((label) => (
            <span
              key={label}
              aria-disabled="true"
              title="Em breve"
              className="cursor-not-allowed py-5 text-sm text-muted-foreground/60"
            >
              {label}
              <span className="sr-only"> (em breve)</span>
            </span>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          {searchOpen ? (
            <form role="search" onSubmit={handleSearch} className="flex items-center gap-1">
              <label htmlFor="header-search" className="sr-only">
                Buscar NFTs
              </label>
              <input
                id="header-search"
                autoFocus
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Buscar NFTs"
                className="h-9 w-40 rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-56"
              />
              <Button type="button" variant="ghost" size="icon" aria-label="Fechar busca" onClick={() => setSearchOpen(false)}>
                <X aria-hidden />
              </Button>
            </form>
          ) : (
            <Button variant="ghost" size="icon" aria-label="Abrir busca" onClick={() => setSearchOpen(true)}>
              <Search aria-hidden />
            </Button>
          )}

                    <Link
            to="/carrinho"
            className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'relative' })}
            aria-label={cartCount > 0 ? `Carrinho, ${cartCount} itens` : 'Carrinho vazio'}
          >
            <ShoppingCart aria-hidden />
            {cartCount > 0 && (
              <span
                aria-hidden
                className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
              >
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </Link>

            {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden text-sm sm:inline" title={user.email}>
                @{user.username}
              </span>
              <Button size="sm" variant="outline" onClick={() => logout.mutate()} disabled={logout.isPending}>
                <LogOut aria-hidden />
                Sair
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => openAuth('login')} disabled={isLoading}>
              <LogIn aria-hidden />
              Entrar
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}