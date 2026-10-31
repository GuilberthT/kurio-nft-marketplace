import { createRootRouteWithContext, createRoute, createRouter, redirect } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { sessionQuery } from '@/auth/session'
import { RootLayout } from '@/components/layout/RootLayout'
import { validateCatalogSearch } from '@/lib/catalogSearch'
import { queryClient } from '@/lib/queryClient'
import { AccountLayout } from '@/pages/account/AccountLayout'
import { ProfilePage } from '@/pages/account/ProfilePage'
import { WalletsPage } from '@/pages/account/WalletsPage'
import { CartPage } from '@/pages/CartPage'
import { CheckoutPage } from '@/pages/CheckoutPage'
import { HomePage } from '@/pages/HomePage'
import { NftDetailPage } from '@/pages/NftDetailPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { OrderPage } from '@/pages/OrderPage'

interface RouterContext {
  queryClient: QueryClient
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: validateCatalogSearch,
  component: HomePage,
})

const nftDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/nft/$nftId',
  component: NftDetailPage,
})

const cartRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/carrinho',
  component: CartPage,
})

/**
 * Fluxos privados: antes de desenhar a tela, a rota espera a sessão ser conferida.
 * Sem sessão, a tela pede login por cima (modal) e mantém o endereço para a retomada.
 */
const ensureSession = ({ context }: { context: RouterContext }) => context.queryClient.ensureQueryData(sessionQuery())

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pagamento',
  beforeLoad: ensureSession,
  component: CheckoutPage,
})

const orderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pedido/$orderId',
  beforeLoad: ensureSession,
  component: OrderPage,
})

const accountRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/conta',
  beforeLoad: ensureSession,
  component: AccountLayout,
})

const accountIndexRoute = createRoute({
  getParentRoute: () => accountRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/conta/perfil' })
  },
})

const profileRoute = createRoute({
  getParentRoute: () => accountRoute,
  path: '/perfil',
  component: ProfilePage,
})

const walletsRoute = createRoute({
  getParentRoute: () => accountRoute,
  path: '/carteiras',
  component: WalletsPage,
})

const routeTree = rootRoute.addChildren([
  homeRoute,
  nftDetailRoute,
  cartRoute,
  checkoutRoute,
  orderRoute,
  accountRoute.addChildren([accountIndexRoute, profileRoute, walletsRoute]),
])

export const router = createRouter({
  routeTree,
  context: { queryClient },
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}