import { Link, Outlet } from '@tanstack/react-router'
import { CircleAlert, Download, Heart, LogOut, ShoppingBasket, TrendingUp, UserRound, Wallet } from 'lucide-react'
import { useAuthDialog } from '@/auth/AuthDialogContext'
import { useLogout, useSession } from '@/auth/session'
import { StatePanel } from '@/components/feedback/StatePanel'
import { Button } from '@/components/ui/button'

const SOON = [
  { label: 'Atividade', icon: ShoppingBasket },
  { label: 'Lista de interesse', icon: Heart },
  { label: 'Ofertas', icon: TrendingUp },
  { label: 'Arquivos baixados', icon: Download },
  { label: 'Suporte', icon: CircleAlert },
] as const

const itemClass =
  'flex shrink-0 items-center gap-3 border-l-4 border-transparent px-3 py-2.5 text-sm text-primary hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring'

/**
 * Área da conta. A rota já garante que a sessão foi carregada (beforeLoad);
 * sem usuário, o login abre por cima e o endereço é mantido para a retomada.
 */
export function AccountLayout() {
  const { user } = useSession()
  const { openAuth } = useAuthDialog()
  const logout = useLogout()

  if (!user) {
    return (
      <div className="py-16">
        <StatePanel
          title="Entre para acessar sua conta"
          description="Seu perfil e suas carteiras ficam disponíveis depois do login."
          action={<Button onClick={() => openAuth('login')}>Entrar</Button>}
        />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-8 pt-8 lg:grid-cols-[310px_1fr] lg:gap-7">
      <aside aria-labelledby="conta-titulo" className="h-fit min-w-0 rounded-sm bg-card py-4">
        <h1 id="conta-titulo" className="px-3 pb-2 text-lg font-bold">
          Meu perfil
        </h1>
        <nav aria-label="Conta" className="relative flex overflow-x-auto lg:flex-col">
          <Link to="/conta/perfil" className={itemClass} activeProps={{ className: 'border-primary! bg-secondary' }}>
            <UserRound aria-hidden className="size-4" />
            Dados do perfil
          </Link>
          <Link to="/conta/carteiras" className={itemClass} activeProps={{ className: 'border-primary! bg-secondary' }}>
            <Wallet aria-hidden className="size-4" />
            Carteiras
          </Link>
          {SOON.map(({ label, icon: Icon }) => (
            <span key={label} aria-disabled="true" title="Em breve" className={`${itemClass} cursor-not-allowed text-primary/50 hover:bg-transparent`}>
              <Icon aria-hidden className="size-4" />
              {label}
              <span className="sr-only"> (em breve)</span>
            </span>
          ))}
        </nav>
        <div className="mt-2 border-t border-border pt-2">
          <button type="button" onClick={() => logout.mutate()} className={`${itemClass} w-full font-bold`}>
            <LogOut aria-hidden className="size-4" />
            Sair
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  )
}