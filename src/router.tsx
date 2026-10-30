import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { RootLayout } from '@/components/layout/RootLayout'
import { validateCatalogSearch } from '@/lib/catalogSearch'
import { HomePage } from '@/pages/HomePage'
import { NftDetailPage } from '@/pages/NftDetailPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { CartPage } from '@/pages/CartPage'
import { CheckoutPage } from '@/pages/CheckoutPage'
import { OrderPage } from '@/pages/OrderPage'

const rootRoute = createRootRoute({
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

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pagamento',
  component: CheckoutPage,
})

const orderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pedido/$orderId',
  component: OrderPage,
})

const routeTree = rootRoute.addChildren([homeRoute, nftDetailRoute, cartRoute, checkoutRoute, orderRoute])

export const router = createRouter({
  routeTree,
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}